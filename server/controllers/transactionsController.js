const prisma = require('../config/db');
const nodemailer = require('nodemailer');
const { logAction } = require('./adminLogController');
const { serialize } = require('../utils/serialize');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const flattenTransaction = (transaction) => {
    const account = transaction.account || {};
    const user = account.user || {};
    const { account: _a, ...txnFields } = transaction;
    const { user: _u, ...accountFields } = account;
    return serialize({ ...txnFields, ...user, ...accountFields });
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

exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            include: {
                account: { include: { user: true } },
            },
            orderBy: { transaction_date: 'desc' },
        });
        res.json(transactions.map(flattenTransaction));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllUserTransactions = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const transactions = await prisma.transaction.findMany({
            where: { account: { user_id: Number(userId) } },
            include: {
                account: { include: { user: true } },
            },
            orderBy: { transaction_date: 'desc' },
        });

        res.json(transactions.map(flattenTransaction));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTotalUserTransactions = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const result = await prisma.transaction.aggregate({
            where: {
                transaction_type: 'deposit',
                account: { user_id: Number(userId) },
            },
            _sum: { amount: true },
        });

        res.json({ total_transactions: Number(result._sum.amount || 0) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTransactionsByAccountId = async (req, res) => {
    const { accountId } = req.params;
    try {
        const transactions = await prisma.transaction.findMany({
            where: { account_id: Number(accountId) },
            orderBy: { transaction_date: 'desc' },
        });
        res.json(serialize(transactions));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addTransaction = async (req, res) => {
    const admin_id = req.user?.userId;
    const { account_id, transaction_type, amount, description } = req.body;

    if (!account_id || !transaction_type || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid transaction details' });
    }

    try {
        const account = await prisma.account.findUnique({
            where: { account_id: Number(account_id) },
            include: { user: true },
        });

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const transactionNumber = await generateTransactionID();
        const created = await prisma.transaction.create({
            data: {
                account_id: Number(account_id),
                transaction_type,
                amount,
                description: description || null,
                transaction_number: transactionNumber,
            },
        });

        if (account.user?.email) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: account.user.email,
                subject: 'Transaction Notification',
                text: `A new ${transaction_type} transaction of amount ${amount} has been logged successfully for your account.`,
            };

            await transporter.sendMail(mailOptions);
        }

        await logAction(
            admin_id,
            `A new ${transaction_type} transaction of amount ${amount} has been added to ${account_id} `,
            'Transactions',
            `Transactions ID=${created.transaction_id}, Ammount=${amount || 0}`
        );

        res.status(201).json({ message: 'Transaction logged successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { transaction_type, amount, description } = req.body;

    if (!transaction_type && !amount && !description) {
        return res.status(400).json({ message: 'No fields provided to update' });
    }

    try {
        const transaction = await prisma.transaction.findUnique({
            where: { transaction_id: Number(id) },
        });
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        await prisma.transaction.update({
            where: { transaction_id: Number(id) },
            data: {
                transaction_type: transaction_type || transaction.transaction_type,
                amount: amount || transaction.amount,
                description: description || transaction.description,
            },
        });

        res.json({ message: 'Transaction updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTransaction = async (req, res) => {
    const { id } = req.params;

    try {
        const transaction = await prisma.transaction.findUnique({
            where: { transaction_id: Number(id) },
            include: { account: { include: { user: true } } },
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const userEmail = transaction.account?.user?.email;

        await prisma.transaction.delete({ where: { transaction_id: Number(id) } });

        if (userEmail) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: 'Transaction Deletion Notification',
                text: `Your transaction with ID ${id} has been deleted.`,
            };

            await transporter.sendMail(mailOptions);
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTransactionsByType = async (req, res) => {
    const { type } = req.params;

    if (type !== 'deposit' && type !== 'withdrawal') {
        return res.status(400).json({ message: 'Invalid transaction type' });
    }

    try {
        const transactions = await prisma.transaction.findMany({
            where: { transaction_type: type },
            orderBy: { transaction_date: 'desc' },
        });
        res.json(serialize(transactions));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTotalTransactions = async (req, res) => {
    const { accountId } = req.params;

    try {
        const result = await prisma.transaction.aggregate({
            where: { account_id: Number(accountId) },
            _count: { _all: true },
            _sum: { amount: true },
        });

        res.json({
            total_transactions: result._count._all,
            total_amount: Number(result._sum.amount || 0),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
