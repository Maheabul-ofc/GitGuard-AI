const crypto = require('crypto');

const validateWebhook = (req, res, next) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    console.warn('GITHUB_WEBHOOK_SECRET not set — skipping webhook validation');
    return next();
  }

  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    return res.status(401).json({ error: 'No signature provided' });
  }

  const body = req.rawBody || JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(body).digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
};

module.exports = validateWebhook;
