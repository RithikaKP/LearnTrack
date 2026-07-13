const asyncHandler = require('express-async-handler');
const StudySession = require('../models/StudySession');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const User = require('../models/User');

const createSession = asyncHandler(async (req, res) => {
    const { subjectId, topicId, sessionType, duration, startTime } = req.body;

    if (!subjectId || !duration) {
        res.status(400);
        throw new Error('Please provide subject and duration');
    }

    const session = await StudySession.create({
        user: req.user.id,
        subject: subjectId,
        topic: topicId,
        sessionType: sessionType || 'pomodoro',
        duration,
        startTime: startTime || new Date(),
        completed: false
    });

    res.status(201).json(session);
});

const completeSession = asyncHandler(async (req, res) => {
    const { actualTime, notes } = req.body;

    const session = await StudySession.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    if (session.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    if (session.completed) {
        res.status(400);
        throw new Error('Session already completed');
    }

    session.completed = true;
    session.actualTime = actualTime || session.duration;
    session.endTime = new Date();
    if (notes) session.notes = notes;

    await session.save();

    if (session.subject) {
        await Subject.findByIdAndUpdate(session.subject, {
            $inc: { totalTimeSpent: session.actualTime }
        });
    }

    if (session.topic) {
        await Topic.findByIdAndUpdate(session.topic, {
            $inc: { timeSpent: session.actualTime }
        });
    }


    const user = await User.findById(req.user.id);
    const today = new Date().toDateString();
    const lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate).toDateString() : null;

    if (lastStudy !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastStudy === yesterdayStr) {

            user.currentStreak += 1;
        } else {
            user.currentStreak = 1;
        }

        if (user.currentStreak > user.longestStreak) {
            user.longestStreak = user.currentStreak;
        }

        user.lastStudyDate = new Date();
        await user.save();
    }

    res.status(200).json(session);
});


const getSessions = asyncHandler(async (req, res) => {
    const { days, limit, topic, subject } = req.query;

    let query = { user: req.user.id, completed: true };

    if (topic) query.topic = topic;
    if (subject) query.subject = subject;

    if (days && days !== 'all') {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - parseInt(days));
        dateLimit.setHours(0, 0, 0, 0);
        query.createdAt = { $gte: dateLimit };
    }

    const sessions = await StudySession.find(query)
        .populate('subject', 'name color icon')
        .populate('topic', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) || 50);

    res.status(200).json(sessions);
});


const getStats = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const stats = await StudySession.aggregate([
        { $match: { user: userId, completed: true } },
        {
            $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                totalTime: { $sum: '$actualTime' },
                avgSessionTime: { $avg: '$actualTime' }
            }
        }
    ]);


    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayStats = await StudySession.aggregate([
        {
            $match: {
                user: userId,
                completed: true,
                createdAt: { $gte: startOfDay }
            }
        },
        {
            $group: {
                _id: null,
                sessionsToday: { $sum: 1 },
                timeToday: { $sum: '$actualTime' }
            }
        }
    ]);

    res.status(200).json({
        totalSessions: stats[0]?.totalSessions || 0,
        totalTime: stats[0]?.totalTime || 0,
        avgSessionTime: Math.round(stats[0]?.avgSessionTime || 0),
        sessionsToday: todayStats[0]?.sessionsToday || 0,
        timeToday: todayStats[0]?.timeToday || 0
    });
});

module.exports = {
    createSession,
    completeSession,
    getSessions,
    getStats
};
