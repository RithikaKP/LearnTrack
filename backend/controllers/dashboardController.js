const asyncHandler = require('express-async-handler');
const Subject = require('../models/Subject');
const StudySession = require('../models/StudySession');
const CodingProblem = require('../models/CodingProblem');
const User = require('../models/User');

// @desc    Get aggregated dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Parallel Data Fetching
    const [subjects, sessions, problems, user] = await Promise.all([
        Subject.find({ user: userId }),
        StudySession.find({
            user: userId,
            completed: true,
            createdAt: { $gte: thirtyDaysAgo }
        }),
        CodingProblem.find({ user: userId }),
        User.findById(userId)
    ]);

    // 1. Subject Stats
    const totalTopics = subjects.reduce((acc, sub) => acc + (sub.totalTopics || 0), 0);
    const completedTopics = subjects.reduce((acc, sub) => acc + (sub.completedTopics || 0), 0);
    const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    const subjectBreakdown = subjects.map(sub => ({
        name: sub.name,
        icon: sub.icon,
        color: sub.color,
        totalTopics: sub.totalTopics,
        completedTopics: sub.completedTopics,
        progress: sub.progressPercentage,
        timeSpent: sub.totalTimeSpent || 0
    }));

    // 2. Time Stats
    const totalTimeSpent = sessions.reduce((acc, sess) => acc + sess.actualTime, 0); // last 30 days
    const uniqueDays = new Set(sessions.map(s => new Date(s.createdAt).toDateString())).size;
    const averageDailyTime = uniqueDays > 0 ? Math.round(totalTimeSpent / uniqueDays) : 0;
    const averageSessionTime = sessions.length > 0 ? Math.round(totalTimeSpent / sessions.length) : 0;

    // Most studied subject
    let mostStudied = 'N/A';
    let maxTime = 0;
    subjectBreakdown.forEach(sub => {
        if (sub.timeSpent > maxTime) {
            maxTime = sub.timeSpent;
            mostStudied = sub.name;
        }
    });

    // 3. Weekly Pattern
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyPattern = days.map(day => ({ day, minutes: 0 }));
    sessions.forEach(sess => {
        const d = new Date(sess.createdAt).getDay();
        weeklyPattern[d].minutes += sess.actualTime;
    });
    // Shift to start Mon (optional, keeping Sun start standard for JS getDay)

    // 4. Pomodoro Stats
    const pomodoros = sessions.filter(s => s.sessionType === 'pomodoro');
    const totalPomodoros = pomodoros.length; // These are completed sessions by query filter
    // If we wanted rate, we'd need attempt count, but we only fetch completed here generally?
    // Actually query was completed: true. So completion rate might need all sessions.
    // Let's do a quick separate count for completion rate if needed, or just assume high completion

    // 5. Coding Problem Stats
    const totalProblems = problems.length;
    const solvedProblems = problems.filter(p => p.status === 'solved').length;
    const attemptedProblems = problems.filter(p => p.status === 'attempted').length;
    const reviewingProblems = problems.filter(p => p.status === 'reviewing').length;

    const problemDifficulty = {
        Easy: problems.filter(p => p.difficulty === 'Easy').length,
        Medium: problems.filter(p => p.difficulty === 'Medium').length,
        Hard: problems.filter(p => p.difficulty === 'Hard').length,
    };

    const platformDistribution = {};
    problems.forEach(p => {
        platformDistribution[p.platform] = (platformDistribution[p.platform] || 0) + 1;
    });

    res.json({
        subjects: {
            totalSubjects: subjects.length,
            totalTopics,
            completedTopics,
            progressPercentage: overallProgress
        },
        timeStats: {
            totalTimeSpent: totalTimeSpent,
            averageDailyTime,
            averageSessionTime,
            mostStudiedSubject: mostStudied
        },
        streaks: {
            currentStreak: user.currentStreak || 0,
            longestStreak: user.longestStreak || 0
        },
        weeklyStudyPattern: weeklyPattern, // Rotated if needed
        subjectBreakdown,
        pomodoroStats: {
            totalPomodoros,
            // Simple count for now
        },
        problemStats: {
            total: totalProblems,
            solved: solvedProblems,
            attempted: attemptedProblems,
            reviewing: reviewingProblems,
            solveRate: totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0,
            difficulty: problemDifficulty,
            platforms: platformDistribution
        }
    });
});

// @desc    Get daily activity details
// @route   GET /api/dashboard/daily-activity
// @access  Private
const getDailyActivity = asyncHandler(async (req, res) => {
    const { date } = req.query;
    const userId = req.user.id;

    // Parse date (start and end of day)
    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Fetch User's Subjects to calculate Day Number
    const subjects = await Subject.find({ user: userId });

    // 2. Fetch Sessions (Time Spent - strictly by Date Activity)
    const sessions = await StudySession.find({
        user: userId,
        completed: true,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('subject', 'name color icon dailyTarget');

    // 3. Fetch Topics based on SCHEDULE (Day Number), not Completion Date
    const topicPromises = subjects.map(async (sub) => {
        const subjectStartDate = new Date(sub.startDate);
        // Normalize to midnight
        const start = new Date(subjectStartDate);
        start.setHours(0, 0, 0, 0);

        const current = new Date(queryDate);
        current.setHours(0, 0, 0, 0);

        const diffTime = current - start;
        // Day 1 is the start date.
        const dayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (dayNum < 1) return []; // Before start date

        // FETCH ALL TOPICS (COMPLETED OR NOT) TO DETERMINE DAILY TARGET
        return require('../models/Topic').find({
            subject: sub._id,
            dayNumber: dayNum
        }).populate('subject', 'name color icon dailyTarget');
    });

    const topicsArrays = await Promise.all(topicPromises);
    const topics = topicsArrays.flat();

    // Group by Subject
    const activityMap = {};

    // 1. Process Sessions (Time Spent)
    sessions.forEach(sess => {
        if (!sess.subject) return;
        const subId = sess.subject._id.toString();

        if (!activityMap[subId]) {
            activityMap[subId] = {
                subjectName: sess.subject.name,
                subjectColor: sess.subject.color,
                subjectIcon: sess.subject.icon,
                dailyTarget: sess.subject.dailyTarget || 0,
                timeSpent: 0,
                topicsCompleted: []
            };
        }
        activityMap[subId].timeSpent += sess.actualTime;
    });

    // 2. Process Topics
    topics.forEach(topic => {
        if (!topic.subject) return;
        const subId = topic.subject._id.toString();

        if (!activityMap[subId]) {
            activityMap[subId] = {
                subjectName: topic.subject.name,
                subjectColor: topic.subject.color,
                subjectIcon: topic.subject.icon,
                dailyTarget: topic.subject.dailyTarget || 0,
                timeSpent: 0,
                topicsCompleted: []
            };
        }

        // If completed, add to list
        if (topic.status === 'completed') {
            activityMap[subId].topicsCompleted.push(topic.name);
        }
    });

    res.json(Object.values(activityMap));
});

module.exports = {
    getDashboardStats,
    getDailyActivity
};
