const asyncHandler = require('express-async-handler');
const Subject = require('../models/Subject');
// Topic and StudySession models will be required here when they are created
// const Topic = require('../models/Topic');
// const StudySession = require('../models/StudySession');

// @desc    Get subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = asyncHandler(async (req, res) => {
    const subjects = await Subject.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(subjects);
});

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
const getSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the subject user
    if (subject.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // SELF-HEALING: Recount topics to ensure accuracy
    const Topic = require('../models/Topic');
    const totalTopics = await Topic.countDocuments({ subject: subject._id });
    const completedTopics = await Topic.countDocuments({ subject: subject._id, status: 'completed' });

    if (subject.totalTopics !== totalTopics || subject.completedTopics !== completedTopics) {
        subject.totalTopics = totalTopics;
        subject.completedTopics = completedTopics;
        await subject.save();
    }

    res.status(200).json(subject);
});

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private
const createSubject = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        startDate,
        endDate,
        dailyTarget,
        color,
        icon
    } = req.body;

    if (!name || !startDate || !endDate) {
        res.status(400);
        throw new Error('Please add all required fields (name, start date, end date)');
    }

    const subject = await Subject.create({
        user: req.user.id,
        name,
        description,
        startDate,
        endDate,
        dailyTarget,
        color,
        icon
    });

    res.status(201).json(subject);
});

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the subject user
    if (subject.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.status(200).json(updatedSubject);
});

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the subject user
    if (subject.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // CASCADE DELETE LOGIC
    // Delete related Topics
    const Topic = require('../models/Topic');
    const StudySession = require('../models/StudySession');

    await Topic.deleteMany({ subject: subject._id });

    // Set subject to null for sessions instead of deleting
    await StudySession.updateMany({ subject: subject._id }, { subject: null, topic: null });

    await subject.deleteOne();

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getSubjects,
    getSubject,
    createSubject,
    updateSubject,
    deleteSubject,
};
