const express = require('express');
const router = express.Router();
const {
    getProblems,
    createProblem,
    updateProblem,
    deleteProblem,
    getStats,
    getRevisionProblems
} = require('../controllers/problemController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getProblems)
    .post(createProblem);

router.get('/stats', getStats);
router.get('/revision', getRevisionProblems);

router.route('/:id')
    .put(updateProblem)
    .delete(deleteProblem);

module.exports = router;
