const PullRequest = require('../models/PullRequest');
const Review = require('../models/Review');
const Log = require('../models/Log');

// GET /api/pullrequests
const getAllPullRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const pullRequests = await PullRequest.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PullRequest.countDocuments();

    res.json({
      pullRequests,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/pullrequests/:id
const getPullRequestById = async (req, res) => {
  try {
    const pr = await PullRequest.findById(req.params.id);
    if (!pr) {
      return res.status(404).json({ error: 'Pull Request not found' });
    }

    const reviews = await Review.find({ prId: pr._id }).sort({ createdAt: -1 });

    res.json({ pullRequest: pr, reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/pullrequests/stats
const getDashboardStats = async (req, res) => {
  try {
    const totalPRs = await PullRequest.countDocuments();
    const reviewedPRs = await PullRequest.countDocuments({ status: 'Reviewed' });
    const pendingPRs = await PullRequest.countDocuments({ status: 'Pending' });

    const totalIssues = await Review.countDocuments();
    const criticalIssues = await Review.countDocuments({ severity: 'Critical' });
    const warningIssues = await Review.countDocuments({ severity: 'Warning' });
    const suggestionIssues = await Review.countDocuments({ severity: 'Suggestion' });

    // Average code quality score
    const avgScore = await PullRequest.aggregate([
      { $match: { codeQualityScore: { $ne: null } } },
      { $group: { _id: null, avgScore: { $avg: '$codeQualityScore' } } }
    ]);

    // Recent activity (last 10 PRs)
    const recentActivity = await PullRequest.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('repoName prNumber prTitle author status codeQualityScore createdAt issuesFound');

    res.json({
      totalPRs,
      reviewedPRs,
      pendingPRs,
      totalIssues,
      criticalIssues,
      warningIssues,
      suggestionIssues,
      avgCodeQualityScore: avgScore.length > 0 ? Math.round(avgScore[0].avgScore) : null,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/pullrequests/:id/reanalyze
const reanalyzePR = async (req, res) => {
  try {
    const pr = await PullRequest.findById(req.params.id);
    if (!pr) {
      return res.status(404).json({ error: 'Pull Request not found' });
    }

    // Clear old reviews for this PR
    await Review.deleteMany({ prId: pr._id });

    // Reset PR status
    pr.status = 'Pending';
    pr.issuesFound = 0;
    pr.codeQualityScore = null;
    await pr.save();

    // Create a new log entry
    await Log.create({
      prId: pr._id,
      repoName: pr.repoName,
      prNumber: pr.prNumber,
      action: 'Re-analyze triggered',
      status: 'Pending',
      llmResponseSummary: 'Re-analysis requested, awaiting processing...'
    });

    // Trigger async analysis
    try {
      const { analyzePR } = require('../services/diffService');
      analyzePR(pr._id).catch(err => {
        console.error(`❌ Re-analysis failed for PR #${pr.prNumber}:`, err.message);
      });
    } catch (e) {
      console.log('⏳ Analysis services not available.');
    }

    res.json({ message: 'Re-analysis triggered', prId: pr._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllPullRequests, getPullRequestById, getDashboardStats, reanalyzePR };
