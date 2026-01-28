const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Subject',
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    name: {
        type: String,
        required: [true, 'Please add a topic name'],
        trim: true
    },
    dayNumber: {
        type: Number,
        required: [true, 'Please add a day number']
    },
    resources: [{
        type: {
            type: String,
            enum: ['youtube', 'article', 'documentation', 'pdf', 'leetcode', 'other'],
            default: 'other'
        },
        url: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'revision'],
        default: 'pending'
    },
    completedAt: {
        type: Date
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    timeSpent: {
        type: Number,
        default: 0 // in minutes
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Compound index to ensure queries for a user's subject topics are fast
topicSchema.index({ user: 1, subject: 1 });

module.exports = mongoose.model('Topic', topicSchema);
