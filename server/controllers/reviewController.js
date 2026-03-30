const Review = require('../models/Review');

// GET /api/reviews
const getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const reviews = await Review.find()
      .populate('prId', 'repoName prNumber prTitle author')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments();

    res.json({
      reviews,
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

// GET /api/reviews/pr/:prId
const getReviewsByPR = async (req, res) => {
  try {
    const reviews = await Review.find({ prId: req.params.prId })
      .sort({ severity: 1, createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllReviews, getReviewsByPR };
