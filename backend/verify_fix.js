const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const fs = require('fs');

const verifyFix = async () => {
    try {
        const conn = await mongoose.connect('mongodb://localhost:27017/learntrack');

        const results = {};

        // Mock the User Query: Date = Jan 27 2026
        const queryDateString = '2026-01-27T10:00:00.000Z'; // Or current date
        const queryDate = new Date(queryDateString); // This is what comes from frontend

        results.queryDate = queryDate.toISOString();

        const startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);

        const dsa = await Subject.findOne({ name: { $regex: 'dsa', $options: 'i' } });
        if (!dsa) {
            results.error = "DSA Subject not found";
            fs.writeFileSync('verify_result.json', JSON.stringify(results, null, 2));
            process.exit(1);
        }

        results.dsaStartDate = dsa.startDate.toISOString();

        const topics = await Topic.find({
            subject: dsa._id,
            status: 'completed',
            completedAt: { $gte: startOfDay, $lte: endOfDay }
        }).populate('subject');

        results.topicsFoundPreFilter = topics.map(t => ({ name: t.name, dayNumber: t.dayNumber }));

        // === SIMULATE CONTROLLER LOGIC BELLOW ===

        const subjectStartDate = new Date(dsa.startDate);
        const start = new Date(subjectStartDate);
        start.setHours(0, 0, 0, 0);

        const current = new Date(queryDate);
        current.setHours(0, 0, 0, 0);

        const diffTime = current - start;
        const currentDayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        results.calculatedDayNumber = currentDayNumber;

        const filteredTopics = [];
        const excludedLog = [];

        topics.forEach(topic => {
            if (topic.dayNumber === currentDayNumber) {
                filteredTopics.push(topic.name);
            } else {
                excludedLog.push({ name: topic.name, day: topic.dayNumber });
            }
        });

        results.finalFilteredList = filteredTopics;
        results.excluded = excludedLog;

        if (!filteredTopics.includes('trie') && filteredTopics.includes('bt') && filteredTopics.includes('ls')) {
            results.status = "SUCCESS";
        } else {
            results.status = "FAILURE";
        }

        fs.writeFileSync('verify_result.json', JSON.stringify(results, null, 2));
        process.exit();
    } catch (error) {
        fs.writeFileSync('verify_result.json', JSON.stringify({ error: error.message }, null, 2));
        process.exit(1);
    }
};

verifyFix();
