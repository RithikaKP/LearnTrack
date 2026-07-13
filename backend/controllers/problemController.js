const asyncHandler = require('express-async-handler');
const CodingProblem = require('../models/CodingProblem');
const User = require('../models/User');
const mongoose = require('mongoose');

const getJourneyStartedAt = (user) => {
    const journeyTimestamp = user?.learnTrackJourneyStartedAt || user?.journeyStartedAt;
    if (!journeyTimestamp) return null;
    return new Date(journeyTimestamp);
};

const isJourneyTrackedProblem = (problem, journeyStartedAt) => {
    if (!journeyStartedAt) return true;
    if (problem.status !== 'solved') return true;
    return problem.solvedAt && new Date(problem.solvedAt) >= journeyStartedAt;
};

const syncMockPlatformPage = async (platform, nextPageToken = null) => {
    const catalog = require('../config/problemsCatalog');
    const mockSolvedByPlatform = {
        LeetCode: ['lc-1', 'lc-167', 'lc-56', 'lc-88'],
        Codeforces: ['cf-4a', 'cf-71a'],
        HackerRank: ['hr-solve-me-first'],
        CodeChef: ['cc-cbs'],
        AtCoder: ['ac-abc086a'],
        GeeksforGeeks: ['gfg-missing']
    };

    const pageSize = 2;
    const problemIds = mockSolvedByPlatform[platform] || [];
    const startIndex = nextPageToken ? Number(nextPageToken) : 0;
    const pageProblemIds = problemIds.slice(startIndex, startIndex + pageSize);

    const items = pageProblemIds
        .map(problemId => catalog.find(item => item.problemId === problemId))
        .filter(Boolean)
        .map((item, index) => ({
            ...item,
            solvedAt: new Date(Date.now() + (index + 1) * 1000)
        }));

    return {
        items,
        nextPageToken: startIndex + pageSize < problemIds.length ? String(startIndex + pageSize) : null
    };
};

const getProblems = asyncHandler(async (req, res) => {
    const { platform, difficulty, status, category, search, subject, topic } = req.query;
    const user = await User.findById(req.user.id);
    const journeyStartedAt = getJourneyStartedAt(user);

    let query = { user: req.user.id };

    if (platform && platform !== 'All') query.platform = platform;
    if (difficulty && difficulty !== 'All') query.difficulty = difficulty;
    if (category && category !== 'All') query.category = category;
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;

    if (status && status !== 'All') {
        query.status = status;
        if (status === 'solved' && journeyStartedAt) {
            query.solvedAt = { $gte: journeyStartedAt };
        }
    } else if (journeyStartedAt) {
        query.$or = [
            { status: { $ne: 'solved' } },
            { status: 'solved', solvedAt: { $gte: journeyStartedAt } }
        ];
    }

    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    const problems = await CodingProblem.find(query)
        .sort({ lastAttempted: -1 });

    res.status(200).json(problems);
});

const getStats = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const user = await User.findById(req.user.id);
    const journeyStartedAt = getJourneyStartedAt(user);

    const problemMatch = {
        user: userId,
        $or: [
            { status: { $ne: 'solved' } },
            { status: 'solved', solvedAt: { $gte: journeyStartedAt || new Date(0) } }
        ]
    };

    const solvedMatch = { user: userId, status: 'solved' };
    if (journeyStartedAt) solvedMatch.solvedAt = { $gte: journeyStartedAt };

    const groupByField = async (field) => {
        return CodingProblem.aggregate([
            { $match: problemMatch },
            { $group: { _id: `$${field}`, count: { $sum: 1 } } }
        ]);
    };

    const [platformStats, difficultyStats, statusStats, categoryStats] = await Promise.all([
        groupByField('platform'),
        groupByField('difficulty'),
        groupByField('status'),
        groupByField('category')
    ]);

    const format = (data) => data.map(item => ({ name: item._id, value: item.count }));

    const totalProblems = await CodingProblem.countDocuments(problemMatch);
    const solvedProblems = await CodingProblem.countDocuments(solvedMatch);

    res.status(200).json({
        total: totalProblems,
        solved: solvedProblems,
        platform: format(platformStats),
        difficulty: format(difficultyStats),
        status: format(statusStats),
        category: format(categoryStats)
    });
});

const getRevisionProblems = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    const journeyStartedAt = getJourneyStartedAt(user);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const problems = await CodingProblem.find({
        user: req.user.id,
        $or: [
            { status: 'to do' },
            { status: 'reviewing' },
            {
                status: 'solved',
                solvedAt: { $gte: journeyStartedAt || new Date(0) },
                lastAttempted: { $lte: thirtyDaysAgo }
            }
        ]
    }).sort({ lastAttempted: 1 }).limit(10);

    res.status(200).json(problems);
});

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

const getProblemsCatalog = asyncHandler(async (req, res) => {
    const { search, platform } = req.query;
    const catalog = require('../config/problemsCatalog');
    
    let results = catalog;
    
    if (platform && platform !== 'All') {
        results = results.filter(p => p.platform.toLowerCase() === platform.toLowerCase());
    }
    
    if (search) {
        const query = search.toLowerCase();
        results = results.filter(p => 
            p.title.toLowerCase().includes(query) ||
            (p.problemId && p.problemId.toLowerCase().includes(query))
        );
    }
    
    res.status(200).json(results.slice(0, 10));
});

const getConnectedPlatforms = asyncHandler(async (req, res) => {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.status(200).json(user.connectedPlatforms || []);
});

const connectPlatform = asyncHandler(async (req, res) => {
    const { platform, username } = req.body;
    if (!platform || !username) {
        res.status(400);
        throw new Error('Platform and username are required');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (!user.learnTrackJourneyStartedAt && !user.journeyStartedAt) {
        const journeyStartedAt = new Date();
        user.learnTrackJourneyStartedAt = journeyStartedAt;
        user.journeyStartedAt = journeyStartedAt;
    }

    const index = user.connectedPlatforms.findIndex(p => p.platform === platform);
    if (index > -1) {
        user.connectedPlatforms[index].username = username;
        user.connectedPlatforms[index].connectedAt = new Date();
    } else {
        user.connectedPlatforms.push({ platform, username, connectedAt: new Date() });
    }

    await user.save();
    res.status(200).json(user.connectedPlatforms);
});

const disconnectPlatform = asyncHandler(async (req, res) => {
    const { platform } = req.body;
    if (!platform) {
        res.status(400);
        throw new Error('Platform is required');
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.connectedPlatforms = user.connectedPlatforms.filter(p => p.platform !== platform);
    await user.save();
    res.status(200).json(user.connectedPlatforms);
});

const autocompleteTopicOnProblemSolve = async (userId, problem) => {
    const problemTags = [
        ...(problem.tags || []),
        problem.category
    ].filter(Boolean).map(t => t.toLowerCase());

    if (problemTags.length === 0) return;

    const Topic = require('../models/Topic');
    const Subject = require('../models/Subject');
    
    const pendingTopics = await Topic.find({
        user: userId,
        status: { $ne: 'completed' }
    });

    for (const topic of pendingTopics) {
        const topicNameLower = topic.name.toLowerCase();
        const isMatch = problemTags.some(tag => {
            return topicNameLower.includes(tag) || 
                   (tag === 'array' && topicNameLower.includes('arrays')) ||
                   (tag === 'string' && topicNameLower.includes('strings')) ||
                   (tag === 'tree' && topicNameLower.includes('trees')) ||
                   (tag === 'graph' && topicNameLower.includes('graphs')) ||
                   (tag === 'linked list' && topicNameLower.includes('linked lists'));
        });

        if (isMatch) {
            topic.status = 'completed';
            topic.completedAt = new Date();
            await topic.save();

            const total = await Topic.countDocuments({ subject: topic.subject });
            const completed = await Topic.countDocuments({ subject: topic.subject, status: 'completed' });
            
            await Subject.findByIdAndUpdate(topic.subject, {
                totalTopics: total,
                completedTopics: completed
            });
        }
    }
};

const syncPlatforms = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const connected = user.connectedPlatforms || [];
    if (connected.length === 0) {
        return res.status(200).json({
            success: true,
            newlySolved: [],
            totalSynced: 0,
            message: 'No platforms connected. Please connect a platform to sync.'
        });
    }

    if (!user.learnTrackJourneyStartedAt && !user.journeyStartedAt) {
        const journeyStartedAt = new Date();
        user.learnTrackJourneyStartedAt = journeyStartedAt;
        user.journeyStartedAt = journeyStartedAt;
    }

    const journeyStartedAt = getJourneyStartedAt(user);
    const newlySolved = [];
    let totalSynced = 0;

    for (const conn of connected) {
        let nextPageToken = null;

        do {
            const { items, nextPageToken: nextToken } = await syncMockPlatformPage(conn.platform, nextPageToken);

            for (const pMeta of items) {
                if (!pMeta.solvedAt || new Date(pMeta.solvedAt) < journeyStartedAt) {
                    continue;
                }

                let problem = await CodingProblem.findOne({
                    user: req.user.id,
                    $or: [
                        { problemId: pMeta.problemId },
                        {
                            platform: pMeta.platform,
                            title: pMeta.title,
                            url: pMeta.url
                        }
                    ]
                });

                const solvedDate = new Date(pMeta.solvedAt);
                let shouldTrack = false;

                if (problem) {
                    const existingSolvedAt = problem.solvedAt ? new Date(problem.solvedAt) : null;
                    const isAlreadyTracked = problem.status === 'solved' && existingSolvedAt && existingSolvedAt >= journeyStartedAt;

                    if (!isAlreadyTracked) {
                        problem.status = 'solved';
                        problem.solvedAt = existingSolvedAt && existingSolvedAt > solvedDate ? existingSolvedAt : solvedDate;
                        problem.lastAttempted = problem.lastAttempted && new Date(problem.lastAttempted) > solvedDate
                            ? new Date(problem.lastAttempted)
                            : solvedDate;
                        problem.difficulty = problem.difficulty || pMeta.difficulty;
                        problem.category = problem.category || pMeta.category;
                        problem.tags = problem.tags?.length ? problem.tags : pMeta.tags;
                        await problem.save();
                        shouldTrack = true;
                    }
                } else {
                    problem = await CodingProblem.create({
                        user: req.user.id,
                        title: pMeta.title,
                        platform: pMeta.platform,
                        difficulty: pMeta.difficulty,
                        category: pMeta.category,
                        tags: pMeta.tags,
                        url: pMeta.url,
                        problemId: pMeta.problemId,
                        status: 'solved',
                        solvedAt: solvedDate,
                        lastAttempted: solvedDate
                    });
                    shouldTrack = true;
                }

                if (shouldTrack) {
                    newlySolved.push({
                        title: problem.title,
                        platform: problem.platform,
                        solvedAt: problem.solvedAt
                    });
                    totalSynced++;
                    await autocompleteTopicOnProblemSolve(req.user.id, problem);
                }
            }

            nextPageToken = nextToken;
        } while (nextPageToken);

        conn.lastSynced = new Date();
    }

    await user.save();

    res.status(200).json({
        success: true,
        newlySolved,
        totalSynced
    });
});

module.exports = {
    getProblems,
    getStats,
    getRevisionProblems,
    createProblem,
    updateProblem,
    deleteProblem,
    getProblemsCatalog,
    getConnectedPlatforms,
    connectPlatform,
    disconnectPlatform,
    syncPlatforms
};
