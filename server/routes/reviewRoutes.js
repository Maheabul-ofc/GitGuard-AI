const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getReviewsByPR
} = require('../controllers/reviewController');

// GET /api/reviews — all reviews
router.get('/', getAllReviews);

// GET /api/reviews/pr/:prId — reviews for a specific PR
router.get('/pr/:prId', getReviewsByPR);

module.exports = router;
