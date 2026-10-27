const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { logAction } = require('./adminLogController');
const xlsx = require('xlsx');
const path = require('path');
const { serialize } = require('../utils/serialize');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendOTPEmail = async (email, otp, subject = 'Your Login OTP', purpose = 'login') => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        text:
            purpose === 'password_reset'
                ? `Your OTP for password reset is: ${otp}. It is valid for 5 minutes. If you did not request this, please contact support immediately.`
                : `Your OTP for login is: ${otp}. It is valid for 5 minutes.`,
    };
    await transporter.sendMail(mailOptions);
};

const findUserByEmailOrPhone = async (emailOrPhone) => {
    return prisma.user.findFirst({
        where: {
            OR: [{ email: emailOrPhone }, { telephone: emailOrPhone }],
        },
    });
};

const USER_UPDATE_FIELDS = [
    'name',
    'email',
    'password_hash',
    'role',
    'identification_number',
    'date_of_birth',
    'place_of_birth',
    'residence_place',
    'telephone',
    'address',
    'position',
    'place_of_working',
    'marital_status',
    'spouse_name',
    'spouse_id_number',
    'spouse_telephone',
    'shares',
    'monthly_saving',
    'otp',
    'otp_expiry',
    'token_version',
    'first_time_login',
];

const pickUserUpdates = (body) => {
    const data = {};
    for (const key of USER_UPDATE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
            data[key] = body[key];
        }
    }
    if (data.date_of_birth) data.date_of_birth = new Date(data.date_of_birth);
    if (data.otp_expiry != null) data.otp_expiry = BigInt(data.otp_expiry);
    return data;
};

exports.loginUser = async (req, res) => {
    const { emailOrPhone, password } = req.body;

    try {
        const userData = await findUserByEmailOrPhone(emailOrPhone);

        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, userData.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email/phone or password' });
        }

        const otp = generateOTP();
        const otpExpiry = Date.now() + 5 * 60 * 1000;
        await prisma.user.update({
            where: { user_id: userData.user_id },
            data: { otp: String(otp), otp_expiry: BigInt(otpExpiry) },
        });

        await sendOTPEmail(userData.email, otp);

        res.json({ message: 'OTP sent to your email. Please confirm to proceed.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone) {
        return res.status(400).json({ message: 'Email or phone is required.' });
    }

    try {
        const userData = await findUserByEmailOrPhone(emailOrPhone);

        if (!userData) {
            return res.json({ message: 'If an account exists for this email/phone, an OTP has been sent.' });
        }

        const otp = generateOTP();
        const otpExpiry = Date.now() + 5 * 60 * 1000;
        await prisma.user.update({
            where: { user_id: userData.user_id },
            data: { otp: String(otp), otp_expiry: BigInt(otpExpiry) },
        });

        await sendOTPEmail(userData.email, otp, 'Your Password Reset OTP', 'password_reset');

        res.json({ message: 'If an account exists for this email/phone, an OTP has been sent.' });
    } catch (error) {
        console.error('Error during forgot password:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.confirmResetPassword = async (req, res) => {
    const { emailOrPhone, otp, newPassword } = req.body;

    if (!emailOrPhone || !otp || !newPassword) {
        return res.status(400).json({ message: 'Email/phone, OTP and new password are required.' });
    }

    try {
        const userData = await findUserByEmailOrPhone(emailOrPhone);

        if (!userData) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const expiry = userData.otp_expiry != null ? Number(userData.otp_expiry) : 0;
        if (userData.otp !== String(otp) || Date.now() > expiry) {
            return res.status(401).json({ message: 'Invalid or expired OTP.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { user_id: userData.user_id },
            data: {
                password_hash: hashedPassword,
                first_time_login: false,
                otp: null,
                otp_expiry: null,
                token_version: { increment: 1 },
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userData.email,
            subject: 'Password Reset Successfully',
            text: `Dear User,\n\nYour password has been reset successfully using the OTP. If you did not perform this action, please contact our support team immediately.\n\nBest regards,\nThe Team`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Password reset successful. You can now log in with your new password.' });
    } catch (error) {
        console.error('Error during password reset with OTP:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.confirmLogin = async (req, res) => {
    const { emailOrPhone, otp } = req.body;

    if (!emailOrPhone || !otp) {
        return res.status(400).json({ message: 'Email/Phone and OTP are required.' });
    }

    try {
        const userData = await findUserByEmailOrPhone(emailOrPhone);

        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        const expiry = userData.otp_expiry != null ? Number(userData.otp_expiry) : 0;
        if (userData.otp !== String(otp) || Date.now() > expiry) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        const updated = await prisma.user.update({
            where: { user_id: userData.user_id },
            data: {
                otp: null,
                otp_expiry: null,
                token_version: { increment: 1 },
            },
        });

        const token = jwt.sign(
            { userId: userData.user_id, role: userData.role, tokenVersion: updated.token_version },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        if (userData.first_time_login) {
            return res.json({
                message: 'OTP confirmed. Please reset your password.',
                firstTimeLogin: true,
                userId: userData.user_id,
                token,
            });
        }

        res.json({ message: 'Login successful', token, role: userData.role });
    } catch (error) {
        console.error('Error during OTP confirmation:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(serialize(users));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { user_id: Number(id) },
            include: {
                accounts: {
                    include: {
                        transactions: {
                            orderBy: { transaction_date: 'desc' },
                            take: 12,
                        },
                    },
                },
                loans: {
                    orderBy: { created_at: 'desc' },
                    include: {
                        repayments: {
                            orderBy: { due_date: 'asc' },
                        },
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const {
            password_hash,
            otp,
            otp_expiry,
            token_version,
            ...safeUser
        } = user;

        const accounts = user.accounts || [];
        const loans = user.loans || [];
        const allTransactions = accounts.flatMap((account) =>
            (account.transactions || []).map((tx) => ({
                ...tx,
                account_id: account.account_id,
                accountnumber: account.accountnumber,
            }))
        );
        allTransactions.sort(
            (a, b) =>
                new Date(b.transaction_date || 0) - new Date(a.transaction_date || 0)
        );

        const totalBalance = accounts.reduce(
            (sum, account) => sum + Number(account.balance || 0),
            0
        );
        const totalShares = Number(user.shares || 0);
        const monthlySaving = Number(user.monthly_saving || 0);
        const activeLoans = loans.filter((loan) =>
            ['pending', 'approved'].includes(loan.status)
        );
        const loanExposure = activeLoans.reduce(
            (sum, loan) => sum + Number(loan.amount || 0),
            0
        );

        res.json(
            serialize({
                ...safeUser,
                accounts: accounts.map(({ transactions, ...account }) => account),
                loans,
                recent_transactions: allTransactions.slice(0, 12),
                summary: {
                    total_balance: totalBalance,
                    total_shares: totalShares,
                    monthly_saving: monthlySaving,
                    accounts_count: accounts.length,
                    loans_count: loans.length,
                    active_loans: activeLoans.length,
                    loan_exposure: loanExposure,
                },
            })
        );
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

const buildUserCreateData = (row, hashedPassword) => ({
    name: row.name,
    email: row.email,
    password_hash: hashedPassword,
    identification_number: row.identification_number || null,
    date_of_birth: row.date_of_birth ? new Date(row.date_of_birth) : null,
    place_of_birth: row.place_of_birth || null,
    residence_place: row.residence_place || null,
    telephone: row.telephone || null,
    address: row.address || null,
    position: row.position || null,
    place_of_working: row.place_of_working || null,
    marital_status: row.marital_status || null,
    spouse_name: row.spouse_name || null,
    spouse_id_number: row.spouse_id_number || null,
    spouse_telephone: row.spouse_telephone || null,
    shares: row.shares ?? 0,
    monthly_saving: row.monthly_saving ?? 0,
});

exports.registerUser = async (req, res) => {
    const body = req.body;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const defaultPassword = crypto.randomBytes(4).toString('hex');
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const accountNumber = await generateAccountNumber();

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: buildUserCreateData(body, hashedPassword),
            });
            const account = await tx.account.create({
                data: {
                    user_id: user.user_id,
                    balance: 0,
                    accountnumber: accountNumber,
                },
            });
            return { user, account };
        });

        await logAction(
            req.user?.userId,
            `Registered user ${body.name} and created an account`,
            'Users & Accounts',
            `User ID=${result.user.user_id}, Account ID=${result.account.account_id}, Email=${body.email}, Account Number=${accountNumber}`
        );

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: body.email,
            subject: 'Welcome to CEPEDHU - Your Default Password',
            text: `Dear ${body.name},\n\nYour account has been successfully created. Your account number is: ${accountNumber}.\nYour default password is: ${defaultPassword}\n\nPlease use https://cepedhu.xyz to log in and reset your password immediately.\n\nBest regards,\nThe CEPEDHU WEB DEV Team`,
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message: 'User registered successfully. Default password and account number sent to email.',
            userId: result.user.user_id,
            accountId: result.account.account_id,
            accountNumber,
        });
    } catch (error) {
        console.error('Error registering user:', error.stack || error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.registerUsersFromExcel = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        for (const row of data) {
            const { name, email } = row;

            if (!email || !name) {
                continue;
            }

            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                console.log(`Email already in use: ${email}`);
                continue;
            }

            const defaultPassword = crypto.randomBytes(4).toString('hex');
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            const accountNumber = await generateAccountNumber();

            const result = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: buildUserCreateData(row, hashedPassword),
                });
                const account = await tx.account.create({
                    data: {
                        user_id: user.user_id,
                        balance: 0,
                        accountnumber: accountNumber,
                    },
                });
                return { user, account };
            });

            await logAction(
                req.user?.userId,
                `Batch registered user ${name} and created an account`,
                'Users & Accounts',
                `User ID=${result.user.user_id}, Email=${email}, Account Number=${accountNumber}`
            );

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Welcome to CEPEDHU - Your Default Password',
                text: `Dear ${name},\n\nYour account has been successfully created. Your account number is: ${accountNumber}.\nYour default password is: ${defaultPassword}\n\nPlease use https://cepedhu.xyz to log in and reset your password immediately.\n\nBest regards,\nThe CEPEDHU WEB DEV Team`,
            };

            await transporter.sendMail(mailOptions);
        }

        res.json({ message: 'Batch registration completed successfully.' });
    } catch (error) {
        console.error('Error during batch registration:', error.stack || error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const data = pickUserUpdates(req.body);

    try {
        await prisma.user.update({
            where: { user_id: Number(id) },
            data,
        });
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.user.delete({ where: { user_id: Number(id) } });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    try {
        const userId = req.user.userId;

        const userData = await prisma.user.findUnique({
            where: { user_id: userId },
            select: { email: true, password_hash: true, first_time_login: true },
        });
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Current password is incorrect.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { user_id: userId },
            data: {
                password_hash: hashedPassword,
                first_time_login: false,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userData.email,
            subject: 'Password Changed Successfully',
            text: `Dear User,\n\nYour password has been changed successfully. If you did not perform this action, please contact our support team immediately.\n\nBest regards,\nThe Team`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Password reset successful. You can now log in with your new password.' });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ error: error.message });
    }
};
