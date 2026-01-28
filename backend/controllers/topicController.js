const asyncHandler = require('express-async-handler');
const Topic = require('../models/Topic');
const Subject = require('../models/Subject');

// @desc    Get topics for a subject
// @route   GET /api/topics/subject/:subjectId
// @access  Private
const getTopics = asyncHandler(async (req, res) => {
    const topics = await Topic.find({
        subject: req.params.subjectId,
        user: req.user.id
    }).sort({ dayNumber: 1 });

    res.status(200).json(topics);
});

// @desc    Get single topic
// @route   GET /api/topics/:id
// @access  Private
const getTopic = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    if (topic.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    res.status(200).json(topic);
});

// @desc    Create topic
// @route   POST /api/topics
// @access  Private
const createTopic = asyncHandler(async (req, res) => {
    const {
        subjectId,
        name,
        dayNumber,
        resources,
        difficulty,
        notes
    } = req.body;

    if (!subjectId || !name || !dayNumber) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    // Verify subject ownership
    const subject = await Subject.findById(subjectId);
    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    if (subject.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const topic = await Topic.create({
        user: req.user.id,
        subject: subjectId,
        name,
        dayNumber,
        resources: resources || [],
        difficulty: difficulty || 'medium',
        notes: notes || ''
    });

    // CASCADE: Increment totalTopics in Subject
    await Subject.findByIdAndUpdate(subjectId, {
        $inc: { totalTopics: 1 }
    });

    res.status(201).json(topic);
});

// @desc    Update topic
// @route   PUT /api/topics/:id
// @access  Private
const updateTopic = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    if (topic.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedTopic = await Topic.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.status(200).json(updatedTopic);
});

// @desc    Update topic status
// @route   PATCH /api/topics/:id/status
// @access  Private
const updateTopicStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
        res.status(400);
        throw new Error('Please provide status');
    }

    const topic = await Topic.findById(req.params.id);

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    if (topic.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const wasCompleted = topic.status === 'completed';
    const nowCompleted = status === 'completed';

    // Update the topic
    topic.status = status;
    if (nowCompleted) {
        topic.completedAt = new Date();
    } else if (!nowCompleted && wasCompleted) {
        topic.completedAt = null; // Un-complete
    }

    await topic.save();

    // CASCADE: Update Subject completedTopics
    if (nowCompleted && !wasCompleted) {
        // Topic just became completed
        await Subject.findByIdAndUpdate(topic.subject, {
            $inc: { completedTopics: 1 }
        });
    } else if (!nowCompleted && wasCompleted) {
        // Topic was uncompleted
        await Subject.findByIdAndUpdate(topic.subject, {
            $inc: { completedTopics: -1 }
        });
    }

    res.status(200).json(topic);
});

// @desc    Delete topic
// @route   DELETE /api/topics/:id
// @access  Private
const deleteTopic = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    if (topic.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const subjectId = topic.subject;
    const isCompleted = topic.status === 'completed';

    await topic.deleteOne();

    // CASCADE: Update Subject counters
    const updateObj = { $inc: { totalTopics: -1 } };
    if (isCompleted) {
        updateObj.$inc.completedTopics = -1;
    }

    await Subject.findByIdAndUpdate(subjectId, updateObj);

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getTopics,
    getTopic,
    createTopic,
    updateTopic,
    updateTopicStatus,
    deleteTopic,
};
