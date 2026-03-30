const mongoose = require('mongoose');

const pullRequestSchema = new mongoose.Schema({
  repoName: {
    type: String,
    required: true
  },
  prNumber: {
    type: Number,
    required: true
  },
  prTitle: {
    type: String,
    default: ''
  },
  author: {
    type: String,
    required: true
  },
  diffUrl: {
    type: String,
    required: true
  },
  htmlUrl: {
    type: String,
    default: ''
  },
  issuesFound: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Analyzing', 'Reviewed', 'Error'],
    default: 'Pending'
  },
  codeQualityScore: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PullRequest', pullRequestSchema);
