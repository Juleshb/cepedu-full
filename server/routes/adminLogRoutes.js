const express = require('express');
const { getAllLogs, getLogsByAdminId } = require('../controllers/adminLogController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getAllLogs); 
router.get('/admin/:adminId', protect, getLogsByAdminId); 

module.exports = router;
