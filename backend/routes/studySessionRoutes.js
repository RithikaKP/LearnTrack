const express = require('express');
const router = express.Router();
const {
    createSession,
    completeSession,
    getSessions,
    getStats
} = require('../controllers/studySessionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getSessions)
    .post(createSession);

router.get('/stats', getStats);
router.patch('/:id/complete', completeSession);

module.exports = router;
