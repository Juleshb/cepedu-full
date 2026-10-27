const express = require('express');
const multer = require('multer');
const {
    getAllUsers,
    getUserById,
    registerUser,
    loginUser,
    confirmLogin,
    updateUser,
    deleteUser,
    resetPassword,
    registerUsersFromExcel,
    forgotPassword,
    confirmResetPassword,
} = require('../controllers/userController');
const { protect, validateTokenVersion } = require('../middleware/authMiddleware');
const upload = multer({ dest: 'uploads/' })

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/confirm-login', confirmLogin);
router.post('/reset-password', protect, resetPassword); 
router.post('/forgot-password', forgotPassword);
router.post('/confirm-reset-password', confirmResetPassword);

router.get('/',protect, validateTokenVersion, getAllUsers);
router.get('/:id', protect, validateTokenVersion, getUserById);
router.put('/:id', protect, validateTokenVersion, updateUser);
router.delete('/:id', protect, validateTokenVersion, deleteUser);
router.post('/batch-register', protect, upload.single('file'), registerUsersFromExcel);

module.exports = router;
