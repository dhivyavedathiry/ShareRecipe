const { User, Recipe } = require('../models');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
            include: [
                { model: Recipe, as: 'recipes' }, // Contributed recipes
                {
                    model: Recipe,
                    as: 'favoriteRecipes',
                    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar_url'] }]
                }, // Favorite recipes with author info
                { model: User, as: 'Following', attributes: ['id', 'username'] } // Followed users
            ]
        });

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (user) {
            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            user.bio = req.body.bio || user.bio;
            user.avatar_url = req.body.avatar_url || user.avatar_url;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                bio: updatedUser.bio,
                avatar_url: updatedUser.avatar_url,
                token: req.headers.authorization.split(' ')[1], // Return same token
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



// @desc    Get public user profile
// @route   GET /api/users/:id/public
// @access  Public
const getPublicProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'username', 'bio', 'avatar_url', 'createdAt'],
            include: [
                {
                    model: Recipe,
                    as: 'recipes',
                    attributes: ['id', 'title', 'image_url', 'cooking_time', 'difficulty', 'createdAt']
                }
            ]
        });

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Toggle favorite recipe
// @route   POST /api/users/favorites/:recipeId
// @access  Private
const toggleFavorite = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const recipe = await Recipe.findByPk(req.params.recipeId);

        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        const hasFavorited = await user.hasFavoriteRecipe(recipe);

        if (hasFavorited) {
            await user.removeFavoriteRecipe(recipe);
            res.json({ message: 'Recipe removed from favorites' });
        } else {
            await user.addFavoriteRecipe(recipe);
            res.json({ message: 'Recipe added to favorites' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    toggleFavorite,
    getPublicProfile,
};


