const express = require('express');
const router = express.Router();
const { getAllLogs } = require('../controllers/logController');

// GET /api/logs
router.get('/', getAllLogs);

module.exports = router;
