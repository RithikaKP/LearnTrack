const express = require('express');
const router = express.Router();
const { getDashboardStats, getDailyActivity } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/daily-activity', protect, getDailyActivity);

module.exports = router;
