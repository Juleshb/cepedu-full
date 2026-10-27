const prisma = require('../config/db');
const { serialize } = require('../utils/serialize');

exports.getAllRepayments = async (req, res) => {
    try {
        const repayments = await prisma.loanRepayment.findMany();
        res.json(serialize(repayments));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRepaymentsByLoanId = async (req, res) => {
    const { loanId } = req.params;
    try {
        const repayments = await prisma.loanRepayment.findMany({
            where: { loan_id: Number(loanId) },
            orderBy: { due_date: 'asc' },
        });
        res.json(serialize(repayments));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addRepayment = async (req, res) => {
    const { loan_id, amount, due_date } = req.body;

    if (!loan_id || !amount || amount <= 0 || !due_date) {
        return res.status(400).json({ message: 'Invalid repayment details' });
    }

    try {
        const repayment = await prisma.loanRepayment.create({
            data: {
                loan_id: Number(loan_id),
                amount,
                due_date: new Date(due_date),
            },
        });

        res.status(201).json({ message: 'Repayment added successfully', repaymentId: repayment.repayment_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.markRepaymentPaid = async (req, res) => {
    const { id } = req.params;

    try {
        const repayment = await prisma.loanRepayment.findUnique({
            where: { repayment_id: Number(id) },
        });
        if (!repayment) {
            return res.status(404).json({ message: 'Repayment not found' });
        }

        if (repayment.status === 'paid') {
            return res.status(400).json({ message: 'Repayment is already marked as paid' });
        }

        await prisma.loanRepayment.update({
            where: { repayment_id: Number(id) },
            data: {
                status: 'paid',
                payment_date: new Date(),
            },
        });

        res.json({ message: 'Repayment marked as paid' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteRepayment = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.loanRepayment.delete({ where: { repayment_id: Number(id) } });
        res.json({ message: 'Repayment deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Repayment not found' });
        }
        res.status(500).json({ error: error.message });
    }
};

const mapRepaymentDetails = (repayment) => ({
    ...repayment,
    loan_amount: repayment.loan?.amount,
    repayment_period: repayment.loan?.repayment_period,
    user_name: repayment.loan?.user?.name,
    user_email: repayment.loan?.user?.email,
    loan: undefined,
});

exports.getAllRepaymentsWithDetails = async (req, res) => {
    try {
        const repayments = await prisma.loanRepayment.findMany({
            include: {
                loan: {
                    include: {
                        user: { select: { name: true, email: true } },
                    },
                },
            },
            orderBy: { due_date: 'asc' },
        });
        res.json(serialize(repayments.map(mapRepaymentDetails)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRepaymentsByLoanIdWithDetails = async (req, res) => {
    const { loanId } = req.params;
    try {
        const repayments = await prisma.loanRepayment.findMany({
            where: { loan_id: Number(loanId) },
            include: {
                loan: {
                    include: {
                        user: { select: { name: true, email: true } },
                    },
                },
            },
            orderBy: { due_date: 'asc' },
        });
        res.json(serialize(repayments.map(mapRepaymentDetails)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
