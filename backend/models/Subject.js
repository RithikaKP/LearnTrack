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
    // Denormalized counters
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
        default: 0 // in minutes
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: Progress Percentage
// Virtual: Progress Percentage
subjectSchema.virtual('progressPercentage').get(function () {
    // 1. Calculate Expected Total based on time
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Projected topics based on plan
    const projectedTotal = totalDays * (this.dailyTarget || 1);

    // Use the larger of actual added topics vs projected topics as the goal post
    // This prevents 100% progress when only 1 topic is added but 100 are expected
    const effectiveTotal = Math.max(this.totalTopics, projectedTotal);

    if (effectiveTotal === 0) return 0;

    return Math.round((this.completedTopics / effectiveTotal) * 100);
});

// Virtual: Days Left
subjectSchema.virtual('daysLeft').get(function () {
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
});

// Cascade delete logic is handled in the controller to avoid circular dependencies
// or can be implemented here if models are loaded. 
// For now, we will handle strict cascading in the controller 
// to ensure we can explicitly update StudySessions.

module.exports = mongoose.model('Subject', subjectSchema);
