const { Review, Recipe, User } = require('../models');

// @desc    Add review to recipe
// @route   POST /api/recipes/:id/reviews
// @access  Private
const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const recipeId = req.params.id;

        if (!rating) {
            return res.status(400).json({ message: 'Rating is required' });
        }

        const recipe = await Recipe.findByPk(recipeId);

        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        // Check if user already reviewed
        const alreadyReviewed = await Review.findOne({
            where: {
                userId: req.user.id,
                recipeId: recipeId,
            },
        });

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'Product already reviewed' });
        }

        const review = await Review.create({
            userId: req.user.id,
            recipeId,
            rating,
            comment,
        });

        res.status(201).json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get reviews for a recipe
// @route   GET /api/recipes/:id/reviews
// @access  Public
const getReviews = async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { recipeId: req.params.id },
            include: [
                { model: User, as: 'reviewer', attributes: ['id', 'username', 'avatar_url'] }
            ]
        });

        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    addReview,
    getReviews,
};
