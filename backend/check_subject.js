const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');

const checkSubject = async () => {
    try {
        const conn = await mongoose.connect('mongodb://localhost:27017/learntrack');
        const subjects = await Subject.find({ name: { $regex: 'dsa', $options: 'i' } });
        console.log("SUBJECTS:");
        subjects.forEach(s => {
            console.log(`Name: ${s.name}, StartDate: ${s.startDate}, ID: ${s._id}`);
        });
        process.exit();
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}
checkSubject();
