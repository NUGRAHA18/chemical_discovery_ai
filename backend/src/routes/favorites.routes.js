const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const { protect } = require('../middleware/auth');
const { favoriteValidation } = require('../middleware/validators');

router.post('/', protect, favoriteValidation, favoritesController.addFavorite);
router.get('/', protect, favoritesController.getFavorites);
router.put('/:id', protect, favoritesController.updateFavorite);
router.delete('/:id', protect, favoritesController.deleteFavorite);

module.exports = router;