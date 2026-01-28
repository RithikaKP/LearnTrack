const asyncHandler = require('express-async-handler');
const CodingProblem = require('../models/CodingProblem');
const mongoose = require('mongoose');

// @desc    Get all problems with filtering
// @route   GET /api/problems
// @access  Private
const getProblems = asyncHandler(async (req, res) => {
    const { platform, difficulty, status, category, search } = req.query;

    let query = { user: req.user.id };

    if (platform && platform !== 'All') query.platform = platform;
    if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;

    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    const problems = await CodingProblem.find(query)
        .sort({ lastAttempted: -1 });

    res.status(200).json(problems);
});

// @desc    Get comprehensive stats
// @route   GET /api/problems/stats
// @access  Private
const getStats = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Group by fields utility
    const groupByField = async (field) => {
        return CodingProblem.aggregate([
            { $match: { user: userId } },
            { $group: { _id: `$${field}`, count: { $sum: 1 } } }
        ]);
    };

    const [platformStats, difficultyStats, statusStats, categoryStats] = await Promise.all([
        groupByField('platform'),
        groupByField('difficulty'),
        groupByField('status'),
        groupByField('category')
    ]);

    // Format for frontend
    const format = (data) => data.map(item => ({ name: item._id, value: item.count }));

    // Solved Count
    const totalProblems = await CodingProblem.countDocuments({ user: userId });
    const solvedProblems = await CodingProblem.countDocuments({ user: userId, status: 'solved' });

    res.status(200).json({
        total: totalProblems,
        solved: solvedProblems,
        platform: format(platformStats),
        difficulty: format(difficultyStats),
        status: format(statusStats),
        category: format(categoryStats)
    });
});

// @desc    Get problems needing revision
// @route   GET /api/problems/revision
// @access  Private
const getRevisionProblems = asyncHandler(async (req, res) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const problems = await CodingProblem.find({
        user: req.user.id,
        $or: [
            { status: 'to do' }, // Not solved yet
            { status: 'reviewing' }, // Explicitly marked for review
            {
                status: 'solved',
                lastAttempted: { $lte: thirtyDaysAgo } // Solved long ago
            }
        ]
    }).sort({ lastAttempted: 1 }).limit(10); // Oldest first

    res.status(200).json(problems);
});

// @desc    Create problem
// @route   POST /api/problems
// @access  Private
const createProblem = asyncHandler(async (req, res) => {
    const { title, url, platform, difficulty } = req.body;

    if (!title || !url || !platform || !difficulty) {
        res.status(400);
        throw new Error('Please fill all required fields');
    }

    const problem = await CodingProblem.create({
        user: req.user.id,
        ...req.body,
        lastAttempted: new Date()
    });

    if (problem.status === 'solved') {
        problem.solvedAt = new Date();
        await problem.save();
    }

    res.status(201).json(problem);
});

// @desc    Update problem
// @route   PUT /api/problems/:id
// @access  Private
const updateProblem = asyncHandler(async (req, res) => {
    const problem = await CodingProblem.findById(req.params.id);

    if (!problem) {
        res.status(404);
        throw new Error('Problem not found');
    }

    if (problem.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const wasSolved = problem.status === 'solved';
    const isNowSolved = req.body.status === 'solved';

    const updatedProblem = await CodingProblem.findByIdAndUpdate(
        req.params.id,
        { ...req.body, lastAttempted: new Date() },
        { new: true }
    );

    if (!wasSolved && isNowSolved) {
        updatedProblem.solvedAt = new Date();
        await updatedProblem.save();
    }

    res.status(200).json(updatedProblem);
});

// @desc    Delete problem
// @route   DELETE /api/problems/:id
// @access  Private
const deleteProblem = asyncHandler(async (req, res) => {
    const problem = await CodingProblem.findById(req.params.id);

    if (!problem) {
        res.status(404);
        throw new Error('Problem not found');
    }

    if (problem.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await problem.deleteOne();
    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getProblems,
    getStats,
    getRevisionProblems,
    createProblem,
    updateProblem,
    deleteProblem
};
