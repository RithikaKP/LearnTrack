const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Load Models
const User = require('./models/User');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const StudySession = require('./models/StudySession');
const CodingProblem = require('./models/CodingProblem');
const Note = require('./models/Note');

// Connect DB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'.cyan.underline))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

const importData = async () => {
    try {
        console.log('Clearing existing data...'.red);
        await User.deleteMany({ email: 'demo@example.com' }); // Only clear demo user
        // We might want to clear related data for this user, but determining ID is hard before creation.
        // For simplicity in this standalone script, let's just create fresh.

        console.log('Creating Demo User...'.green);
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('123456', salt);

        const user = await User.create({
            name: 'Demo Student',
            email: 'demo@example.com',
            password: 'password', // Storing hashed in DB, wait. User methods are skipped on create usually? No, let's just use the schema logic implies hash in pre-save.
            // Actually our User model hashes in pre-save. So we should pass plain text.
            // Check User.js: "if (!this.isModified('password'))"
        });

        // Wait, if I use create({password: '123456'}), the pre-save hook will hash it.
        // Let's re-fetch the user just to be safe or use the instance.
        const userId = user._id;

        console.log(`Demo User ID: ${userId}`.green);

        // --- SUBJECTS ---
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

        // --- TOPICS ---
        console.log('Adding Topics...'.yellow);
        const topics = await Topic.insertMany([
            { user: userId, subject: subjects[0]._id, name: 'Arrays & Strings', status: 'completed', dayNumber: 1, difficulty: 'easy' },
            { user: userId, subject: subjects[0]._id, name: 'Linked Lists', status: 'completed', dayNumber: 2, difficulty: 'medium' },
            { user: userId, subject: subjects[0]._id, name: 'Binary Trees', status: 'in-progress', dayNumber: 3, difficulty: 'hard' },
            { user: userId, subject: subjects[2]._id, name: 'React Hooks', status: 'completed', dayNumber: 1, difficulty: 'medium' },
            { user: userId, subject: subjects[2]._id, name: 'Node.js Basics', status: 'in-progress', dayNumber: 2, difficulty: 'medium' }
        ]);

        // --- SESSIONS (Last 30 Days) ---
        console.log('Adding Study Sessions...'.yellow);
        const sessions = [];
        const daysAgo = (d) => {
            const date = new Date();
            date.setDate(date.getDate() - d);
            return date;
        };

        // Generate random sessions
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
                createdAt: daysAgo(Math.floor(Math.random() * 30)) // Important for filtering
            });
        }
        await StudySession.insertMany(sessions);

        // --- CODING PROBLEMS ---
        console.log('Adding Coding Problems...'.yellow);
        await CodingProblem.insertMany([
            { user: userId, title: 'Two Sum', platform: 'LeetCode', difficulty: 'Easy', status: 'solved', url: 'https://leetcode.com/problems/two-sum', tags: ['array', 'hash-map'] },
            { user: userId, title: 'LRU Cache', platform: 'LeetCode', difficulty: 'Medium', status: 'solved', url: 'https://leetcode.com/problems/lru-cache', tags: ['design', 'linked-list'] },
            { user: userId, title: 'Median of Two Sorted Arrays', platform: 'LeetCode', difficulty: 'Hard', status: 'attempted', url: 'https://leetcode.com', tags: ['binary-search'] },
            { user: userId, title: 'Watermelon', platform: 'CodeForces', difficulty: 'Easy', status: 'solved', url: 'https://codeforces.com', tags: ['math'] },
            { user: userId, title: 'Reverse Linked List', platform: 'LeetCode', difficulty: 'Easy', status: 'reviewing', url: 'https://leetcode.com', tags: ['linked-list'] }
        ]);

        // --- NOTES ---
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
