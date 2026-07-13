const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    name: {
        type: String,
        required: [true, 'Please add a subject name'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, 'Please add a start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Please add an end date']
    },
    dailyTarget: {
        type: Number,
        default: 2,
        min: [1, 'Daily target must be at least 1']
    },
    color: {
        type: String,
        default: '#3B82F6'
    },
    icon: {
        type: String,
        default: '📚'
    },
    totalTopics: {
        type: Number,
        default: 0
    },
    completedTopics: {
        type: Number,
        default: 0
    },
    totalTimeSpent: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'archived', 'completed'],
        default: 'active'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

subjectSchema.virtual('progressPercentage').get(function () {
    if (this.totalTopics === 0) return 0;
    return Math.round((this.completedTopics / this.totalTopics) * 100);
});

subjectSchema.virtual('daysLeft').get(function () {
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
});


module.exports = mongoose.model('Subject', subjectSchema);
