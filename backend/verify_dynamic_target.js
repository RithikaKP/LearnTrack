const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const fs = require('fs');

const verifyDynamicTarget = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/learntrack');
        const results = {};

        // 1. Test Day 1 (Jan 27)
        const date1 = new Date('2026-01-27T10:00:00.000Z');
        results.day1 = await simulateController(date1);

        // 2. Test Day 2 (Jan 28)
        const date2 = new Date('2026-01-28T10:00:00.000Z');
        results.day2 = await simulateController(date2);

        fs.writeFileSync('verify_dynamic_result.json', JSON.stringify(results, null, 2));
        process.exit();
    } catch (error) {
        console.error(error);
        fs.writeFileSync('verify_dynamic_result.json', JSON.stringify({ error: error.message }, null, 2));
        process.exit(1);
    }
};

async function simulateController(queryDate) {
    // Find DSA subject
    const sub = await Subject.findOne({ name: { $regex: 'dsa', $options: 'i' } });

    if (!sub) return { error: "DSA Subject not found" };

    const subjectStartDate = new Date(sub.startDate);
    const start = new Date(subjectStartDate);
    start.setHours(0, 0, 0, 0);

    const current = new Date(queryDate);
    current.setHours(0, 0, 0, 0);

    const diffTime = current - start;
    const dayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // SIMULATING CONTROLLER LOGIC:
    // 1. Fetch ALL topics for the day
    const topics = await Topic.find({
        subject: sub._id,
        dayNumber: dayNum
    });

    // 2. Calculate Stats
    const totalDailyTopics = topics.length;
    const completedList = topics.filter(t => t.status === 'completed').map(t => t.name);

    // 3. Determine Final Target
    // Logic: If topics exist, dailyTarget = totalDailyTopics
    const dailyTarget = totalDailyTopics > 0 ? totalDailyTopics : (sub.dailyTarget || 0);

    return {
        queryDate: queryDate.toISOString(),
        dayNum,
        totalTopicsFound: totalDailyTopics, // This is the new dailyTarget
        completedTopics: completedList,
        calculatedProgress: `${completedList.length}/${dailyTarget}`
    };
}

verifyDynamicTarget();
