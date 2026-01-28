const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Please add content']
    },
    tags: [{
        type: String,
        trim: true
    }],
    isRevision: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient filtering/sorting
noteSchema.index({ user: 1, isPinned: -1, updatedAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
