const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { protect } = require('../middleware/auth');

router.post('/json', protect, exportController.exportJSON);
router.post('/csv', protect, exportController.exportCSV);
router.post('/pdf', protect, exportController.exportPDF);

module.exports = router;