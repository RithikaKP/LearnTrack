const asyncHandler = require('express-async-handler');
const Subject = require('../models/Subject');

const getSubjects = asyncHandler(async (req, res) => {
    const subjects = await Subject.find({ user: req.user.id }).sort({ createdAt: -1 });
    const Topic = require('../models/Topic');
    
    const subjectsWithCurrentTopic = await Promise.all(subjects.map(async (sub) => {
        const currentTopic = await Topic.findOne({
            subject: sub._id,
            status: { $nin: ['completed', 'mastered'] }
        }).sort({ dayNumber: 1 });
        
        const subObj = sub.toObject({ virtuals: true });
        subObj.currentTopicName = currentTopic ? currentTopic.name : 'All completed! 🎉';
        return subObj;
    }));

    res.status(200).json(subjectsWithCurrentTopic);
});

const getSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    if (subject.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const Topic = require('../models/Topic');
    const totalTopics = await Topic.countDocuments({ subject: subject._id });
    const completedTopics = await Topic.countDocuments({ subject: subject._id, status: { $in: ['completed', 'mastered'] } });

    if (subject.totalTopics !== totalTopics || subject.completedTopics !== completedTopics) {
        subject.totalTopics = totalTopics;
        subject.completedTopics = completedTopics;
        await subject.save();
    }

    res.status(200).json(subject);
});

const createSubject = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        startDate,
        dailyTarget,
        color,
        icon,
        topics
    } = req.body;

    if (!name || !startDate) {
        res.status(400);
        throw new Error('Please add name and start date');
    }

    const start = new Date(startDate);
    const target = parseInt(dailyTarget, 10) || 2;
    let totalTopicsCount = 0;
    let calculatedEndDate;

    if (topics && Array.isArray(topics) && topics.length > 0) {
        totalTopicsCount = topics.length;
        const totalDays = Math.ceil(totalTopicsCount / target);
        calculatedEndDate = new Date(start.getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000);
    } else {
        calculatedEndDate = req.body.endDate ? new Date(req.body.endDate) : new Date(start.getTime() + 29 * 24 * 60 * 60 * 1000);
    }

    const subject = await Subject.create({
        user: req.user.id,
        name,
        description,
        startDate: start,
        endDate: calculatedEndDate,
        dailyTarget: target,
        color,
        icon,
        totalTopics: totalTopicsCount,
        completedTopics: 0
    });

    if (topics && Array.isArray(topics) && topics.length > 0) {
        const topicsToInsert = topics.map((t, index) => {
            const dayNum = Math.floor(index / target) + 1;
            const assigned = new Date(start);
            assigned.setDate(start.getDate() + (dayNum - 1));
            return {
                user: req.user.id,
                subject: subject._id,
                name: typeof t === 'string' ? t : t.name,
                description: typeof t === 'string' ? '' : (t.description || ''),
                dayNumber: dayNum,
                assignedDate: assigned,
                status: 'pending',
                difficulty: 'medium',
                resources: typeof t === 'string' ? [] : (t.resources || [])
            };
        });
        await Topic.insertMany(topicsToInsert);
    }

    res.status(201).json(subject);
});

const updateSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

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

const deleteSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    if (subject.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const Topic = require('../models/Topic');
    const StudySession = require('../models/StudySession');

    await Topic.deleteMany({ subject: subject._id });

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
