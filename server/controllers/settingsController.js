const Settings = require('../models/Settings');

// GET /api/settings
const getSettings = async (req, res) => {
  try {
    // Get or create default settings (singleton pattern)
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        strictMode: false,
        ignoreStylingIssues: false,
        enableSecurityScan: true,
        enablePerformanceScan: true
      });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/settings
const updateSettings = async (req, res) => {
  try {
    const { strictMode, ignoreStylingIssues, enableSecurityScan, enablePerformanceScan } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        strictMode: strictMode || false,
        ignoreStylingIssues: ignoreStylingIssues || false,
        enableSecurityScan: enableSecurityScan !== false,
        enablePerformanceScan: enablePerformanceScan !== false
      });
    } else {
      if (strictMode !== undefined) settings.strictMode = strictMode;
      if (ignoreStylingIssues !== undefined) settings.ignoreStylingIssues = ignoreStylingIssues;
      if (enableSecurityScan !== undefined) settings.enableSecurityScan = enableSecurityScan;
      if (enablePerformanceScan !== undefined) settings.enablePerformanceScan = enablePerformanceScan;
      settings.updatedAt = Date.now();
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getSettings, updateSettings };
