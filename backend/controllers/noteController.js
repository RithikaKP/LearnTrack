const asyncHandler = require('express-async-handler');
const Note = require('../models/Note');
const mongoose = require('mongoose');

// @desc    Get all notes
// @route   GET /api/notes
// @access  Private
const getNotes = asyncHandler(async (req, res) => {
    const { search, isPinned, isRevision, subjectId, topicId } = req.query;

    let query = { user: req.user.id };

    if (isPinned === 'true') query.isPinned = true;
    if (isRevision === 'true') query.isRevision = true;
    if (subjectId) query.subject = subjectId;
    if (topicId) query.topic = topicId;

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } }
        ];
    }

    // Sort: Pinned first, then by updatedAt desc
    const notes = await Note.find(query).sort({ isPinned: -1, updatedAt: -1 });

    res.status(200).json(notes);
});

// @desc    Create note
// @route   POST /api/notes
// @access  Private
const createNote = asyncHandler(async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        res.status(400);
        throw new Error('Please add title and content');
    }

    const note = await Note.create({
        user: req.user.id,
        ...req.body
    });

    res.status(201).json(note);
});

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
        res.status(404);
        throw new Error('Note not found');
    }

    if (note.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedNote = await Note.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.status(200).json(updatedNote);
});

// @desc    Toggle pin status
// @route   PATCH /api/notes/:id/pin
// @access  Private
const togglePinNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
        res.status(404);
        throw new Error('Note not found');
    }

    if (note.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    note.isPinned = !note.isPinned;
    await note.save();

    res.status(200).json(note);
});

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
        res.status(404);
        throw new Error('Note not found');
    }

    if (note.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await note.deleteOne();

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getNotes,
    createNote,
    updateNote,
    togglePinNote,
    deleteNote
};
