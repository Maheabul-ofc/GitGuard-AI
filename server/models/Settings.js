const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  strictMode: {
    type: Boolean,
    default: false
  },
  ignoreStylingIssues: {
    type: Boolean,
    default: false
  },
  enableSecurityScan: {
    type: Boolean,
    default: true
  },
  enablePerformanceScan: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
