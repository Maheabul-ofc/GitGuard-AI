const { GoogleGenerativeAI } = require('@google/generative-ai');
const Review = require('../models/Review');
const Settings = require('../models/Settings');

/**
 * Build the analysis prompt based on current settings
 */
const buildPrompt = (diffContent, settings) => {
  let scanInstructions = '';

  if (settings.enableSecurityScan) {
    scanInstructions += '- **Security vulnerabilities** (SQL injection, XSS, hardcoded secrets, insecure dependencies, etc.)\n';
  }
  if (settings.enablePerformanceScan) {
    scanInstructions += '- **Performance issues** (memory leaks, N+1 queries, unnecessary re-renders, blocking operations, etc.)\n';
  }
  if (!settings.ignoreStylingIssues) {
    scanInstructions += '- **Code style issues** (naming conventions, code organization, readability, etc.)\n';
  }

  const strictNote = settings.strictMode
    ? '\n⚠️ STRICT MODE is enabled. Be very thorough and flag even minor issues. Apply the highest standards.'
    : '';

  return `You are an expert code reviewer for the GitGuard AI system. Analyze the following code diff from a GitHub Pull Request and identify issues.
${strictNote}

**Scan for:**
- **Bugs** (logic errors, null pointer exceptions, off-by-one errors, race conditions, etc.)
${scanInstructions}
- **Best practice violations** (error handling, input validation, SOLID principles, etc.)

**For each issue found, provide:**
1. Issue type (Bug, Security, Performance, Style, or Best Practice)
2. Severity (Critical, Warning, or Suggestion)
3. File name where the issue exists
4. Clear description of the problem
5. Suggested fix with a corrected code block

**Also provide:**
- A Code Quality Score from 0-100 (100 = perfect code)
- A brief overall summary

**IMPORTANT: Respond ONLY with valid JSON in this exact format:**

{
  "codeQualityScore": 85,
  "summary": "Overall assessment of the code changes",
  "issues": [
    {
      "issueType": "Bug",
      "severity": "Critical",
      "fileName": "path/to/file.js",
      "description": "Description of the issue",
      "suggestedFix": "Corrected code or explanation"
    }
  ]
}

If no issues are found, return an empty issues array with a score of 100.

**CODE DIFF TO ANALYZE:**

${diffContent}`;
};

/**
 * Analyze code diff using Google Gemini AI
 */
const analyzeWithAI = async (diffContent, prId) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('⚠️ Gemini API key not configured — using mock analysis');
    return await mockAnalysis(diffContent, prId);
  }

  // Get current settings
  let settings = await Settings.findOne();
  if (!settings) {
    settings = {
      strictMode: false,
      ignoreStylingIssues: false,
      enableSecurityScan: true,
      enablePerformanceScan: true
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = buildPrompt(diffContent, settings);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // Clean up the response — remove markdown code fences if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', text.substring(0, 200));
      // Fallback: create a single issue with the raw response
      analysis = {
        codeQualityScore: 70,
        summary: 'AI analysis completed but response format was unexpected.',
        issues: [{
          issueType: 'Best Practice',
          severity: 'Suggestion',
          fileName: 'general',
          description: 'AI analysis returned an unstructured response. Manual review recommended.',
          suggestedFix: text.substring(0, 500)
        }]
      };
    }

    // Store each issue as a Review in the database
    const issues = analysis.issues || [];
    for (const issue of issues) {
      await Review.create({
        prId,
        issueType: issue.issueType || 'Best Practice',
        description: issue.description || 'No description provided',
        suggestedFix: issue.suggestedFix || '',
        severity: issue.severity || 'Suggestion',
        fileName: issue.fileName || ''
      });
    }

    return {
      totalIssues: issues.length,
      codeQualityScore: analysis.codeQualityScore || 80,
      summary: analysis.summary || 'Analysis complete',
      issues
    };

  } catch (error) {
    console.error('Gemini API error:', error.message);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

/**
 * Mock analysis for when no API key is configured
 * Generates sample review data for testing
 */
const mockAnalysis = async (diffContent, prId) => {
  console.log('🧪 Running mock analysis...');

  const mockIssues = [
    {
      issueType: 'Bug',
      severity: 'Warning',
      fileName: 'detected-in-diff',
      description: 'Potential null reference detected. Consider adding a null check before accessing object properties.',
      suggestedFix: 'Add a null/undefined check: if (obj && obj.property) { ... }'
    },
    {
      issueType: 'Security',
      severity: 'Critical',
      fileName: 'detected-in-diff',
      description: 'User input is used directly without sanitization. This could lead to injection vulnerabilities.',
      suggestedFix: 'Sanitize all user inputs before processing. Use a validation library like Joi or express-validator.'
    },
    {
      issueType: 'Performance',
      severity: 'Suggestion',
      fileName: 'detected-in-diff',
      description: 'Consider using more efficient data structure or algorithm for this operation.',
      suggestedFix: 'Review the time complexity and consider using a Map or Set for O(1) lookups.'
    }
  ];

  // Store mock reviews
  for (const issue of mockIssues) {
    await Review.create({
      prId,
      ...issue
    });
  }

  return {
    totalIssues: mockIssues.length,
    codeQualityScore: 72,
    summary: 'Mock analysis: Found 3 potential issues including 1 critical security concern.',
    issues: mockIssues
  };
};

module.exports = { analyzeWithAI };
