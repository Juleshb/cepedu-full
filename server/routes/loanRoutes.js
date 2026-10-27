const express = require('express');
const {
    getAllLoansWithUserDetails,
    getLoanByIdWithUserDetails,
    getUserLoansAndRepayments,
    applyForLoan,
    approveLoan,
    rejectLoan,
    deleteLoan,
} = require('../controllers/loanController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getAllLoansWithUserDetails);
router.get('/:id', protect, getLoanByIdWithUserDetails);
router.get('/user/:userId', protect, getUserLoansAndRepayments); 
router.post('/', protect, applyForLoan);
router.put('/:id/approve', protect, approveLoan);
router.put('/:id/reject', protect, rejectLoan);
router.delete('/:id', protect, deleteLoan);

module.exports = router;
