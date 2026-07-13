const express = require('express');
const router = express.Router();
const {
    getTopics,
    getTopic,
    createTopic,
    updateTopic,
    updateTopicStatus,
    deleteTopic,
    generateTopicSuggestions
} = require('../controllers/topicController');
const { protect } = require('../middleware/authMiddleware');

router.route('/generate').post(protect, generateTopicSuggestions);
router.route('/').post(protect, createTopic);
router.route('/:id').get(protect, getTopic).put(protect, updateTopic).delete(protect, deleteTopic);
router.route('/subject/:subjectId').get(protect, getTopics);
router.route('/:id/status').patch(protect, updateTopicStatus);

module.exports = router;
