const express = require('express');
const router = express.Router();
const {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePinNote
} = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getNotes)
    .post(createNote);

router.route('/:id')
    .put(updateNote)
    .delete(deleteNote);

router.patch('/:id/pin', togglePinNote);

module.exports = router;
