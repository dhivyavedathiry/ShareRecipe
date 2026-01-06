const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, deleteAnyRecipe, getAllRecipes, getAllReviews, deleteReview } = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(admin); // Apply admin check to all routes

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.delete('/recipes/:id', deleteAnyRecipe);
router.get('/recipes', getAllRecipes);
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
