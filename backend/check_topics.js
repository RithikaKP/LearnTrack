const mongoose = require('mongoose');
const fs = require('fs');
// Register models
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');

const checkTopics = async () => {
    try {
        const conn = await mongoose.connect('mongodb://localhost:27017/learntrack');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Filter for specific topics
        const topics = await Topic.find({
            name: { $in: ['trie', 'bt', 'ls', 'bst'] }
        }).populate('subject');

        let output = "TOPIC DATA:\n";
        topics.forEach(t => {
            output += `Topic: ${t.name}, Day: ${t.dayNumber}, Status: ${t.status}, CompletedAtSync: ${t.completedAt ? t.completedAt.toISOString() : 'null'}, CompletedAtLocal: ${t.completedAt ? t.completedAt.toLocaleString() : 'null'}\n`;
        });

        fs.writeFileSync('topics_clean.txt', output, 'utf8');
        console.log("Written to topics_clean.txt");

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkTopics();
