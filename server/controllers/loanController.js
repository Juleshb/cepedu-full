const prisma = require('../config/db');
const { logAction } = require('./adminLogController');
const { serialize } = require('../utils/serialize');

exports.getAllLoans = async (req, res) => {
    try {
        const loans = await prisma.loan.findMany();
        res.json(serialize(loans));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLoanById = async (req, res) => {
    const { id } = req.params;
    try {
        const loan = await prisma.loan.findUnique({ where: { loan_id: Number(id) } });
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }
        res.json(serialize(loan));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.applyForLoan = async (req, res) => {
    const { user_id, amount, repayment_period } = req.body;

    if (!user_id || !amount || amount <= 0 || !repayment_period) {
        return res.status(400).json({ message: 'Invalid loan details' });
    }

    try {
        const loan = await prisma.loan.create({
            data: {
                user_id: Number(user_id),
                amount,
                repayment_period: Number(repayment_period),
            },
        });

        res.status(201).json({ message: 'Loan application submitted', loanId: loan.loan_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.approveLoan = async (req, res) => {
    const { id } = req.params;
    const admin_id = req.user.userId;

    try {
        const loan = await prisma.loan.findUnique({ where: { loan_id: Number(id) } });
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        if (loan.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending loans can be approved' });
        }

        await prisma.loan.update({
            where: { loan_id: Number(id) },
            data: { status: 'approved' },
        });

        await logAction(
            admin_id,
            `Approved loan_id=${id}`,
            'Loans',
            `Loan approved for user_id=${loan.user_id}, Amount=${loan.amount}`
        );

        res.json({ message: 'Loan approved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.rejectLoan = async (req, res) => {
    const { id } = req.params;
    const admin_id = req.user.userId;

    try {
        const loan = await prisma.loan.findUnique({ where: { loan_id: Number(id) } });
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        if (loan.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending loans can be rejected' });
        }

        await prisma.loan.update({
            where: { loan_id: Number(id) },
            data: { status: 'rejected' },
        });

        await logAction(
            admin_id,
            `Rejected loan_id=${id}`,
            'Loans',
            `Loan rejected for user_id=${loan.user_id}, Amount=${loan.amount}`
        );

        res.json({ message: 'Loan rejected successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteLoan = async (req, res) => {
    const { id } = req.params;
    const admin_id = req.user.userId;
    try {
        const loan = await prisma.loan.findUnique({ where: { loan_id: Number(id) } });
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        await prisma.loan.delete({ where: { loan_id: Number(id) } });

        await logAction(
            admin_id,
            `Deleted loan_id=${id}`,
            'Loans',
            `Loan deleted for user_id=${loan.user_id}, Amount=${loan.amount}`
        );

        res.json({ message: 'Loan deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const mapLoanWithMember = (loan) => {
    const accounts = loan.user?.accounts || [];
    const accountNumbers = accounts.map((account) => account.accountnumber).filter(Boolean);

    return {
        ...loan,
        user_name: loan.user?.name || null,
        user_email: loan.user?.email || null,
        user_telephone: loan.user?.telephone || null,
        account_number: accountNumbers[0] || null,
        account_numbers: accountNumbers,
        user: undefined,
    };
};

exports.getAllLoansWithUserDetails = async (req, res) => {
    try {
        const loans = await prisma.loan.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        telephone: true,
                        accounts: {
                            select: { accountnumber: true, account_id: true },
                            orderBy: { account_id: 'asc' },
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        res.json(serialize(loans.map(mapLoanWithMember)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLoanByIdWithUserDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const loan = await prisma.loan.findUnique({
            where: { loan_id: Number(id) },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        telephone: true,
                        accounts: {
                            select: { accountnumber: true, account_id: true },
                            orderBy: { account_id: 'asc' },
                        },
                    },
                },
            },
        });
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        res.json(serialize(mapLoanWithMember(loan)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserLoansAndRepayments = async (req, res) => {
    const { userId } = req.params;
    try {
        const loans = await prisma.loan.findMany({
            where: { user_id: Number(userId) },
            orderBy: { created_at: 'desc' },
        });

        const loanIds = loans.map((loan) => loan.loan_id);
        const repayments =
            loanIds.length > 0
                ? await prisma.loanRepayment.findMany({
                      where: { loan_id: { in: loanIds } },
                      orderBy: { due_date: 'asc' },
                  })
                : [];

        res.json(serialize({ loans, repayments }));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
