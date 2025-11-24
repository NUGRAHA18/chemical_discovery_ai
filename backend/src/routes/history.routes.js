const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { protect } = require('../middleware/auth');

router.get('/', protect, historyController.getHistory);
router.get('/stats', protect, historyController.getStats);

module.exports = router;