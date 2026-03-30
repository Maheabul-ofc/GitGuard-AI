const PullRequest = require('../models/PullRequest');
const Log = require('../models/Log');

// Handle incoming GitHub webhook events
const handleWebhook = async (req, res) => {
  try {
    const event = req.headers['x-github-event'];

    // Only process pull_request events
    if (event !== 'pull_request') {
      return res.status(200).json({ message: `Event '${event}' ignored` });
    }

    const { action, pull_request, repository } = req.body;

    // Only process when a PR is opened or synchronized
    if (action !== 'opened' && action !== 'synchronize') {
      return res.status(200).json({ message: `Action '${action}' ignored` });
    }

    const repoName = repository.full_name;
    const prNumber = pull_request.number;
    const author = pull_request.user.login;
    const diffUrl = pull_request.diff_url;
    const prTitle = pull_request.title;
    const htmlUrl = pull_request.html_url;

    console.log(`\n🔔 PR #${prNumber} ${action} on ${repoName} by ${author}`);

    // Store PR data in MongoDB
    let pr = await PullRequest.findOne({ repoName, prNumber });

    if (pr) {
      // Update existing PR
      pr.status = 'Pending';
      pr.diffUrl = diffUrl;
      pr.prTitle = prTitle;
      await pr.save();
    } else {
      // Create new PR record
      pr = await PullRequest.create({
        repoName,
        prNumber,
        prTitle,
        author,
        diffUrl,
        htmlUrl,
        status: 'Pending'
      });
    }

    // Create a log entry
    await Log.create({
      prId: pr._id,
      repoName,
      prNumber,
      action: `PR ${action}`,
      status: 'Pending',
      llmResponseSummary: 'Webhook received, awaiting analysis...'
    });

    console.log(`✅ PR #${prNumber} stored in database with ID: ${pr._id}`);

    // Trigger async analysis (Week 2+3 services will be called here)
    // We import these dynamically so the webhook still works without them
    try {
      const { analyzePR } = require('../services/diffService');
      analyzePR(pr._id).catch(err => {
        console.error(`❌ Analysis failed for PR #${prNumber}:`, err.message);
      });
    } catch (e) {
      console.log('⏳ Analysis services not yet configured — PR stored only.');
    }

    res.status(200).json({
      message: 'Webhook processed successfully',
      prId: pr._id,
      prNumber,
      repoName
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { handleWebhook };
