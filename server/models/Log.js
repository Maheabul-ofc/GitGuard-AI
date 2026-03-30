const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  prId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PullRequest',
    default: null
  },
  repoName: {
    type: String,
    required: true
  },
  prNumber: {
    type: Number,
    required: true
  },
  action: {
    type: String,
    default: 'analyze'
  },
  timeTaken: {
    type: Number, // in milliseconds
    default: 0
  },
  llmResponseSummary: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Success', 'Error', 'Pending'],
    default: 'Pending'
  },
  errorMessage: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Log', logSchema);
