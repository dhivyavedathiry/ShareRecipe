const express = require('express');
const router = express.Router();
const {
    createRecipe,
    getRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe
} = require('../controllers/recipeController');
const { protect } = require('../middlewares/authMiddleware');

// Re-route into other resource routers
const reviewRouter = require('./reviewRoutes');
router.use('/:id/reviews', reviewRouter);

router.route('/')
    .get(getRecipes)
    .post(protect, createRecipe);

router.route('/:id')
    .get(getRecipeById)
    .put(protect, updateRecipe)
    .delete(protect, deleteRecipe);

module.exports = router;
