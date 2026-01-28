const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    },
    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic'
    },
    sessionType: {
        type: String,
        enum: ['pomodoro', 'custom'],
        default: 'pomodoro'
    },
    duration: {
        type: Number,
        required: true // planned duration in minutes
    },
    actualTime: {
        type: Number,
        default: 0 // actual time studied in minutes
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    },
    completed: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Compound index for efficient queries on user sessions over time
studySessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
