const express = require('express');
const multer = require('multer');
const {
    getAllAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    deleteAccount,
    depositToAccount,
    withdrawFromAccount,
    uploadAndDeposit, 
} = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.get('/', protect, getAllAccounts);
router.get('/:id', protect, getAccountById);
router.post('/', protect, createAccount);
router.put('/:id', protect, updateAccount);
router.delete('/:id', protect, deleteAccount);

router.post('/:id/deposit', protect, depositToAccount);
router.post('/:id/withdraw', protect, withdrawFromAccount);

router.post('/batch-deposit', protect, upload.single('file'), uploadAndDeposit);

module.exports = router;
