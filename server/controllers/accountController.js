const prisma = require('../config/db');
const { logAction } = require('./adminLogController');
const nodemailer = require('nodemailer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { serialize } = require('../utils/serialize');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const flattenAccountUser = (account) => {
    const { user, ...accountFields } = account;
    return serialize({ ...accountFields, ...user });
};

exports.getAllAccounts = async (req, res) => {
    try {
        const accounts = await prisma.account.findMany({
            include: { user: true },
        });
        res.json(accounts.map(flattenAccountUser));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAccountById = async (req, res) => {
    const { id } = req.params;
    try {
        const account = await prisma.account.findUnique({
            where: { account_id: Number(id) },
        });
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        res.json(serialize(account));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const generateAccountNumber = async () => {
    while (true) {
        const accountNumber = Math.floor(100000 + Math.random() * 900000);
        const existing = await prisma.account.findUnique({ where: { accountnumber: accountNumber } });
        if (!existing) return accountNumber;
    }
};

exports.createAccount = async (req, res) => {
    const admin_id = req.user?.userId;
    const { user_id, balance } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { user_id: Number(user_id) } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const accountnumber = await generateAccountNumber();
        const account = await prisma.account.create({
            data: {
                user_id: Number(user_id),
                balance: balance || 0,
                accountnumber,
            },
        });

        await logAction(
            admin_id,
            `Created an account for user_id=${user_id}`,
            'Accounts',
            `Account ID=${account.account_id}, Initial Balance=${balance || 0}`
        );

        res.status(201).json({ message: 'Account created successfully', accountId: account.account_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const ACCOUNT_UPDATE_FIELDS = ['balance', 'accountnumber', 'user_id'];

exports.updateAccount = async (req, res) => {
    const admin_id = req.user.userId;
    const { id } = req.params;
    const updates = {};
    for (const key of ACCOUNT_UPDATE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
            updates[key] = req.body[key];
        }
    }

    try {
        await prisma.account.update({
            where: { account_id: Number(id) },
            data: updates,
        });

        await logAction(admin_id, `Updated account_id=${id}`, 'Accounts', `Updated Fields: ${JSON.stringify(updates)}`);

        res.json({ message: 'Account updated successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Account not found' });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    const admin_id = req.user.userId;
    const { id } = req.params;

    try {
        await prisma.account.delete({ where: { account_id: Number(id) } });

        await logAction(admin_id, `Deleted account_id=${id}`, 'Accounts', `Account ID=${id} was removed`);

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Account not found' });
        }
        res.status(500).json({ error: error.message });
    }
};

const generateTransactionID = async () => {
    while (true) {
        const transactionNumber = Math.floor(100000000 + Math.random() * 900000000);
        const existing = await prisma.transaction.findUnique({
            where: { transaction_number: transactionNumber },
        });
        if (!existing) return transactionNumber;
    }
};

exports.depositToAccount = async (req, res) => {
    const admin_id = req.user.userId;
    const { id } = req.params;
    const { amount, description } = req.body;
    const transactionNumber = await generateTransactionID();

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid deposit amount' });
    }

    try {
        const accountId = Number(id);
        const account = await prisma.account.findUnique({
            where: { account_id: accountId },
            include: { user: true },
        });
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        await prisma.$transaction([
            prisma.account.update({
                where: { account_id: accountId },
                data: { balance: { increment: amount } },
            }),
            prisma.transaction.create({
                data: {
                    account_id: accountId,
                    transaction_type: 'deposit',
                    amount,
                    description: description || 'Deposit to account',
                    transaction_number: transactionNumber,
                },
            }),
        ]);

        if (account.user?.email) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: account.user.email,
                subject: 'Deposit Notification',
                text: `A deposit of ${amount} has been made to your account \nTxid:${transactionNumber}.`,
            };
            await transporter.sendMail(mailOptions);
        }

        await logAction(
            admin_id,
            `Deposited ${amount} to ${account.accountnumber} with TX-${transactionNumber}`,
            'Transactions',
            `Description: ${description || 'Deposit'}`
        );

        res.json({ message: `Deposited ${amount} to account ${id}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.uploadAndDeposit = async (req, res) => {
    const admin_id = req.user.userId;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        for (const row of data) {
            const { account_id, amount, description } = row;
            if (!account_id || !amount || amount <= 0) {
                continue;
            }

            const transactionNumber = await generateTransactionID();
            const accountId = Number(account_id);

            const account = await prisma.account.findUnique({
                where: { account_id: accountId },
                include: { user: true },
            });
            if (!account) {
                continue;
            }

            await prisma.$transaction([
                prisma.account.update({
                    where: { account_id: accountId },
                    data: { balance: { increment: amount } },
                }),
                prisma.transaction.create({
                    data: {
                        account_id: accountId,
                        transaction_type: 'deposit',
                        amount,
                        description: description || 'Batch deposit',
                        transaction_number: transactionNumber,
                    },
                }),
            ]);

            if (account.user?.email) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: account.user.email,
                    subject: 'Deposit Notification',
                    text: `A batch deposit of ${amount} has been made to your account.\nTxid: ${transactionNumber}.`,
                };
                await transporter.sendMail(mailOptions);
            }

            await logAction(
                admin_id,
                `Deposited ${amount} to account ${account.accountnumber} with TX-${transactionNumber}`,
                'Batch Deposit',
                `Description: ${description || 'Batch Deposit'}`
            );
        }

        fs.unlinkSync(filePath);
        res.json({ message: 'Batch deposits completed successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.withdrawFromAccount = async (req, res) => {
    const admin_id = req.user.userId;
    const { id } = req.params;
    const { amount, description } = req.body;
    const transactionNumber = await generateTransactionID();

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    try {
        const accountId = Number(id);
        const account = await prisma.account.findUnique({
            where: { account_id: accountId },
            include: { user: true },
        });
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        if (Number(account.balance) < Number(amount)) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        await prisma.$transaction([
            prisma.account.update({
                where: { account_id: accountId },
                data: { balance: { decrement: amount } },
            }),
            prisma.transaction.create({
                data: {
                    account_id: accountId,
                    transaction_type: 'withdrawal',
                    amount,
                    description: description || 'Withdrawal from account',
                    transaction_number: transactionNumber,
                },
            }),
        ]);

        if (account.user?.email) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: account.user.email,
                subject: 'Withdrawal Notification',
                text: `A withdrawal of ${amount} has been made from your account \nTxid:${transactionNumber}.`,
            };
            await transporter.sendMail(mailOptions);
        }

        await logAction(
            admin_id,
            `Withdrew ${amount} from ${account.accountnumber} with TX-${transactionNumber}`,
            'Transactions',
            `Description: ${description || 'Withdrawal'}`
        );

        res.json({ message: `Withdrew ${amount} from account ${id}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
