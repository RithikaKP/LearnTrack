const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const StudySession = require('./models/StudySession');
const CodingProblem = require('./models/CodingProblem');
const Note = require('./models/Note');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'.cyan.underline))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

const importData = async () => {
    try {
        console.log('Clearing existing data...'.red);
        await User.deleteMany({ email: 'demo@example.com' });

        console.log('Creating Demo User...'.green);
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('123456', salt);

        const user = await User.create({
            name: 'Demo Student',
            email: 'demo@example.com',
            password: 'password',
            connectedPlatforms: [
                { platform: 'LeetCode', username: 'demostudent_lc', connectedAt: new Date() },
                { platform: 'Codeforces', username: 'demostudent_cf', connectedAt: new Date() }
            ]
        });

        const userId = user._id;

        console.log(`Demo User ID: ${userId}`.green);

        console.log('Adding Subjects...'.yellow);
        const today = new Date();
        const thirtyDaysAhead = new Date();
        thirtyDaysAhead.setDate(today.getDate() + 30);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const subjectDocs = [
            { user: userId, name: 'Data Structures', color: '#3B82F6', icon: '🌳', totalTopics: 20, completedTopics: 12, totalTimeSpent: 1200, startDate: thirtyDaysAgo, endDate: thirtyDaysAhead },
            { user: userId, name: 'Algorithms', color: '#EF4444', icon: '⚡', totalTopics: 15, completedTopics: 5, totalTimeSpent: 600, startDate: thirtyDaysAgo, endDate: thirtyDaysAhead },
            { user: userId, name: 'Web Development', color: '#10B981', icon: '🌐', totalTopics: 30, completedTopics: 25, totalTimeSpent: 3000, startDate: thirtyDaysAgo, endDate: thirtyDaysAhead },
            { user: userId, name: 'System Design', color: '#8B5CF6', icon: '🏗️', totalTopics: 10, completedTopics: 2, totalTimeSpent: 300, startDate: thirtyDaysAgo, endDate: thirtyDaysAhead }
        ];
        const subjects = await Subject.insertMany(subjectDocs);

        console.log('Adding Topics...'.yellow);
        const topics = await Topic.insertMany([
            { user: userId, subject: subjects[0]._id, name: 'Arrays & Strings', status: 'completed', dayNumber: 1, difficulty: 'easy' },
            { user: userId, subject: subjects[0]._id, name: 'Linked Lists', status: 'completed', dayNumber: 2, difficulty: 'medium' },
            { user: userId, subject: subjects[0]._id, name: 'Binary Trees', status: 'in-progress', dayNumber: 3, difficulty: 'hard' },
            { user: userId, subject: subjects[2]._id, name: 'React Hooks', status: 'completed', dayNumber: 1, difficulty: 'medium' },
            { user: userId, subject: subjects[2]._id, name: 'Node.js Basics', status: 'in-progress', dayNumber: 2, difficulty: 'medium' }
        ]);

        console.log('Adding Study Sessions...'.yellow);
        const sessions = [];
        const daysAgo = (d) => {
            const date = new Date();
            date.setDate(date.getDate() - d);
            return date;
        };

        for (let i = 0; i < 20; i++) {
            const sub = subjects[Math.floor(Math.random() * subjects.length)];
            const isPom = Math.random() > 0.3;
            sessions.push({
                user: userId,
                subject: sub._id,
                sessionType: isPom ? 'pomodoro' : 'custom',
                duration: 25,
                actualTime: 25 + Math.floor(Math.random() * 20),
                startTime: daysAgo(Math.floor(Math.random() * 30)),
                completed: true,
                createdAt: daysAgo(Math.floor(Math.random() * 30))
            });
        }
        await StudySession.insertMany(sessions);

        console.log('Adding Coding Problems...'.yellow);
        await CodingProblem.insertMany([
            { user: userId, title: 'Two Sum', platform: 'LeetCode', difficulty: 'Easy', status: 'solved', url: 'https://leetcode.com/problems/two-sum', tags: ['Array', 'Hash Table'], problemId: 'lc-1', solvedAt: new Date() },
            { user: userId, title: 'LRU Cache', platform: 'LeetCode', difficulty: 'Medium', status: 'solved', url: 'https://leetcode.com/problems/lru-cache', tags: ['Design', 'Hash Table', 'Linked List'], problemId: 'lc-146', solvedAt: new Date() },
            { user: userId, title: 'Median of Two Sorted Arrays', platform: 'LeetCode', difficulty: 'Hard', status: 'planned', url: 'https://leetcode.com/problems/median-of-two-sorted-arrays', tags: ['Array', 'Binary Search', 'Divide and Conquer'], problemId: 'lc-4', targetDate: new Date() },
            { user: userId, title: 'Watermelon', platform: 'Codeforces', difficulty: 'Easy', status: 'solved', url: 'https://codeforces.com/problemset/problem/4/A', tags: ['Math', 'Greedy'], problemId: 'cf-4a', solvedAt: new Date() },
            { user: userId, title: 'Reverse Linked List', platform: 'LeetCode', difficulty: 'Easy', status: 'planned', url: 'https://leetcode.com/problems/reverse-linked-list', tags: ['Linked List', 'Recursion'], problemId: 'lc-206', targetDate: new Date() }
        ]);

        console.log('Adding Notes...'.yellow);
        await Note.insertMany([
            { user: userId, title: 'React useEffect', content: 'Runs after render. Returns cleanup function.', tags: ['react', 'hooks'], isPinned: true },
            { user: userId, title: 'BFS vs DFS', content: 'BFS uses Queue. DFS uses Stack (recursion).', tags: ['algorithms'], isPinned: false }
        ]);

        console.log('Data Imported!'.green.inverse);
        console.log('Login with: demo@example.com / 123456');
        process.exit();

    } catch (err) {
        console.error(`${err}`.red.inverse);
        process.exit(1);
    }
};

importData();
