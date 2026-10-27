const express = require('express');
const {
    getAllRepaymentsWithDetails,
    getRepaymentsByLoanIdWithDetails,
    addRepayment,
    markRepaymentPaid,
    deleteRepayment,
} = require('../controllers/loanRepaymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getAllRepaymentsWithDetails);
router.get('/loan/:loanId', protect, getRepaymentsByLoanIdWithDetails);
router.post('/', protect, addRepayment);
router.put('/:id/paid', protect, markRepaymentPaid);
router.delete('/:id', protect, deleteRepayment);

module.exports = router;
