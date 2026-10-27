const express = require('express');
const {
    getAllTransactions,
    getTransactionsByAccountId,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByType,
    getTotalTransactions,
    getAllUserTransactions,
    getTotalUserTransactions,
} = require('../controllers/transactionsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getAllTransactions);
router.get('/user', protect, getAllUserTransactions);
router.get('/userbalance', protect, getTotalUserTransactions);
router.get('/:accountId', protect, getTransactionsByAccountId);
router.post('/', protect, addTransaction);
router.put('/:id', protect, updateTransaction);
router.delete('/:id', protect, deleteTransaction);
router.get('/type/:type', protect, getTransactionsByType); 
router.get('/:accountId/total', protect, getTotalTransactions);

module.exports = router;
