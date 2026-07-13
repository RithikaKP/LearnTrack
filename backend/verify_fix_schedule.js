const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const fs = require('fs');

const verifySchedule = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/learntrack');
        const results = {};

        const date1 = new Date('2026-01-27T10:00:00.000Z');
        results.testDay1 = await simulateController(date1);

        const date2 = new Date('2026-01-28T10:00:00.000Z');
        results.testDay2 = await simulateController(date2);

        fs.writeFileSync('verify_schedule_result.json', JSON.stringify(results, null, 2));
        process.exit();
    } catch (error) {
        console.error(error);
        fs.writeFileSync('verify_schedule_result.json', JSON.stringify({ error: error.message }, null, 2));
        process.exit(1);
    }
};

async function simulateController(queryDate) {
    const userId = "6795f609f16b4e2175c232b2c";
    const sub = await Subject.findOne({ name: { $regex: 'dsa', $options: 'i' } });

    const subjectStartDate = new Date(sub.startDate);
    const start = new Date(subjectStartDate);
    start.setHours(0, 0, 0, 0);

    const current = new Date(queryDate);
    current.setHours(0, 0, 0, 0);

    const diffTime = current - start;
    const dayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const topics = await Topic.find({
        subject: sub._id,
        dayNumber: dayNum,
        status: 'completed'
    });

    return {
        queryDate: queryDate.toISOString(),
        calcDay: dayNum,
        topics: topics.map(t => t.name)
    };
}

verifySchedule();
