const express = require('express');
const router = express.Router();
const {
  getAllPullRequests,
  getPullRequestById,
  getDashboardStats,
  reanalyzePR
} = require('../controllers/prController');

// GET /api/pullrequests/stats — dashboard statistics
router.get('/stats', getDashboardStats);

// GET /api/pullrequests — all PRs
router.get('/', getAllPullRequests);

// GET /api/pullrequests/:id — single PR
router.get('/:id', getPullRequestById);

// POST /api/pullrequests/:id/reanalyze — re-trigger analysis
router.post('/:id/reanalyze', reanalyzePR);

module.exports = router;
