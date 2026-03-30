const express = require('express');
const router = express.Router();
const validateWebhook = require('../middleware/validateWebhook');
const { handleWebhook } = require('../controllers/webhookController');

// POST /api/webhook/github
router.post('/github', validateWebhook, handleWebhook);

module.exports = router;
