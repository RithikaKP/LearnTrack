const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const fs = require('fs');

const verifyDynamicTarget = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/learntrack');
        const results = {};

        const date1 = new Date('2026-01-27T10:00:00.000Z');
        results.day1 = await simulateController(date1);

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
    const sub = await Subject.findOne({ name: { $regex: 'dsa', $options: 'i' } });

    if (!sub) return { error: "DSA Subject not found" };

    const subjectStartDate = new Date(sub.startDate);
    const start = new Date(subjectStartDate);
    start.setHours(0, 0, 0, 0);

    const current = new Date(queryDate);
    current.setHours(0, 0, 0, 0);

    const diffTime = current - start;
    const dayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const topics = await Topic.find({
        subject: sub._id,
        dayNumber: dayNum
    });

    const totalDailyTopics = topics.length;
    const completedList = topics.filter(t => t.status === 'completed').map(t => t.name);

    const dailyTarget = totalDailyTopics > 0 ? totalDailyTopics : (sub.dailyTarget || 0);

    return {
        queryDate: queryDate.toISOString(),
        dayNum,
        totalTopicsFound: totalDailyTopics,
        completedTopics: completedList,
        calculatedProgress: `${completedList.length}/${dailyTarget}`
    };
}

verifyDynamicTarget();
