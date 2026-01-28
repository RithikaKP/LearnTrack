const mongoose = require('mongoose');

const codingProblemSchema = new mongoose.Schema({
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
    platform: {
        type: String,
        required: true,
        enum: [
            'LeetCode',
            'CodeForces',
            'HackerRank',
            'GeeksforGeeks',
            'CodeChef',
            'AtCoder',
            'Custom'
        ]
    },
    problemNumber: {
        type: String,
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    url: {
        type: String,
        required: [true, 'Please add a URL'],
        match: [
            /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
            'Please add a valid URL'
        ]
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['Easy', 'Medium', 'Hard']
    },
    category: {
        type: String,
        default: 'Other',
        enum: [
            'Array', 'String', 'Tree', 'Graph', 'DP', 'Greedy',
            'Backtracking', 'Math', 'Bit Manipulation', 'Sorting',
            'Searching', 'Linked List', 'Stack', 'Queue', 'Heap',
            'Hash Table', 'Design', 'Other'
        ]
    },
    status: {
        type: String,
        default: 'to do',
        enum: ['to do', 'solved', 'reviewing']
    },
    attempts: {
        type: Number,
        default: 1,
        min: 1
    },
    solvedAt: {
        type: Date
    },
    notes: {
        type: String
    },
    tags: [{
        type: String,
        trim: true
    }],
    timeComplexity: {
        type: String
    },
    spaceComplexity: {
        type: String
    },
    lastAttempted: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient filtering
codingProblemSchema.index({ user: 1, platform: 1, status: 1 });
codingProblemSchema.index({ user: 1, lastAttempted: -1 });

module.exports = mongoose.model('CodingProblem', codingProblemSchema);
