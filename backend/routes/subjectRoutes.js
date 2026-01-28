const express = require('express');
const router = express.Router();
const {
    getSubjects,
    createSubject,
    getSubject,
    updateSubject,
    deleteSubject,
} = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getSubjects).post(protect, createSubject);
router.route('/:id').get(protect, getSubject).put(protect, updateSubject).delete(protect, deleteSubject);

module.exports = router;
