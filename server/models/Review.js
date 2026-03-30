const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  prId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PullRequest',
    required: true
  },
  issueType: {
    type: String,
    enum: ['Bug', 'Security', 'Performance', 'Style', 'Best Practice'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  suggestedFix: {
    type: String,
    default: ''
  },
  severity: {
    type: String,
    enum: ['Critical', 'Warning', 'Suggestion'],
    required: true
  },
  fileName: {
    type: String,
    default: ''
  },
  lineNumber: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);
