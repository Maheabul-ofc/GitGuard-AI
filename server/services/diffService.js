const { Octokit } = require('octokit');
const PullRequest = require('../models/PullRequest');
const Log = require('../models/Log');
const { analyzeWithAI } = require('./aiAnalyzer');
const { postReviewComment } = require('./githubCommentService');

// Initialize Octokit
const getOctokit = () => {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
};

/**
 * Fetch the diff for a Pull Request using Octokit
 */
const fetchDiff = async (owner, repo, prNumber) => {
  const octokit = getOctokit();

  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: {
      format: 'diff'
    }
  });

  return data;
};

/**
 * Fetch the list of changed files for a Pull Request
 */
const fetchChangedFiles = async (owner, repo, prNumber) => {
  const octokit = getOctokit();

  const { data } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber
  });

  return data;
};

/**
 * Parse a unified diff string into structured changed blocks
 */
const parseDiff = (diffContent) => {
  const files = [];
  const fileSections = diffContent.split('diff --git');

  for (let i = 1; i < fileSections.length; i++) {
    const section = fileSections[i];
    const lines = section.split('\n');

    // Extract filename
    const fileMatch = lines[0].match(/b\/(.+)/);
    const fileName = fileMatch ? fileMatch[1] : 'unknown';

    // Extract only added/modified lines (lines starting with +, excluding +++ header)
    const addedLines = [];
    const removedLines = [];

    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        addedLines.push(line.substring(1));
      }
      if (line.startsWith('-') && !line.startsWith('---')) {
        removedLines.push(line.substring(1));
      }
    }

    if (addedLines.length > 0 || removedLines.length > 0) {
      files.push({
        fileName,
        addedLines,
        removedLines,
        rawDiff: section
      });
    }
  }

  return files;
};

/**
 * Clean and prepare the diff for LLM consumption
 * Limits content to avoid token limits
 */
const prepareDiffForAI = (parsedFiles) => {
  let preparedContent = '';
  const MAX_CHARS = 15000; // Limit to avoid token overflow

  for (const file of parsedFiles) {
    const fileBlock = `\n--- File: ${file.fileName} ---\n` +
      `Added lines:\n${file.addedLines.join('\n')}\n` +
      `Removed lines:\n${file.removedLines.join('\n')}\n`;

    if ((preparedContent + fileBlock).length > MAX_CHARS) {
      preparedContent += '\n[... additional files truncated due to size limits ...]\n';
      break;
    }

    preparedContent += fileBlock;
  }

  return preparedContent;
};

/**
 * Main function: Analyze a Pull Request end-to-end
 * Called by the webhook controller after PR is stored
 */
const analyzePR = async (prId) => {
  const startTime = Date.now();
  const pr = await PullRequest.findById(prId);

  if (!pr) {
    throw new Error(`PR with id ${prId} not found`);
  }

  const [owner, repo] = pr.repoName.split('/');

  // Update status to Analyzing
  pr.status = 'Analyzing';
  await pr.save();

  try {
    // Step 1: Fetch the diff
    console.log(`📥 Fetching diff for ${pr.repoName}#${pr.prNumber}...`);
    const rawDiff = await fetchDiff(owner, repo, pr.prNumber);

    // Step 2: Parse and clean the diff
    const parsedFiles = parseDiff(rawDiff);
    const cleanedDiff = prepareDiffForAI(parsedFiles);

    if (!cleanedDiff || cleanedDiff.trim().length === 0) {
      console.log('⚠️ No meaningful code changes found in diff');
      pr.status = 'Reviewed';
      pr.issuesFound = 0;
      pr.codeQualityScore = 100;
      await pr.save();

      await Log.findOneAndUpdate(
        { prId: pr._id, status: 'Pending' },
        {
          status: 'Success',
          timeTaken: Date.now() - startTime,
          llmResponseSummary: 'No meaningful code changes to analyze'
        }
      );
      return;
    }

    // Step 3: Send to AI for analysis
    console.log(`🤖 Sending diff to AI for analysis...`);
    const aiResult = await analyzeWithAI(cleanedDiff, prId);

    // Step 4: Update PR with results
    pr.status = 'Reviewed';
    pr.issuesFound = aiResult.totalIssues;
    pr.codeQualityScore = aiResult.codeQualityScore;
    await pr.save();

    // Step 5: Post comment to GitHub PR
    console.log(`💬 Posting review comment to GitHub...`);
    await postReviewComment(owner, repo, pr.prNumber, aiResult);

    // Step 6: Update log
    const timeTaken = Date.now() - startTime;
    await Log.findOneAndUpdate(
      { prId: pr._id, status: 'Pending' },
      {
        status: 'Success',
        timeTaken,
        llmResponseSummary: `Found ${aiResult.totalIssues} issues. Quality score: ${aiResult.codeQualityScore}/100. Analysis took ${(timeTaken / 1000).toFixed(1)}s.`
      }
    );

    console.log(`✅ Analysis complete for ${pr.repoName}#${pr.prNumber} — ${aiResult.totalIssues} issues found`);

  } catch (error) {
    console.error(`❌ Analysis error for PR #${pr.prNumber}:`, error.message);

    pr.status = 'Error';
    await pr.save();

    await Log.findOneAndUpdate(
      { prId: pr._id, status: 'Pending' },
      {
        status: 'Error',
        timeTaken: Date.now() - startTime,
        errorMessage: error.message,
        llmResponseSummary: `Analysis failed: ${error.message}`
      }
    );

    throw error;
  }
};

module.exports = { analyzePR, fetchDiff, parseDiff, prepareDiffForAI };
