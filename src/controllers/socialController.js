const { User, Recipe } = require('../models');

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = async (req, res) => {
    try {
        const userToFollow = await User.findByPk(req.params.id);
        const currentUser = await User.findByPk(req.user.id);

        if (!userToFollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToFollow.id === currentUser.id) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const isFollowing = await currentUser.hasFollowing(userToFollow);

        if (isFollowing) {
            await currentUser.removeFollowing(userToFollow);
            res.json({ message: 'User unfollowed' });
        } else {
            await currentUser.addFollowing(userToFollow);
            res.json({ message: 'User followed' });
        }
    } catch (error) {
        console.error('Error in followUser:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get activity feed (recipes from followed users)
// @route   GET /api/users/feed
// @access  Private
const getUserFeed = async (req, res) => {
    try {
        const currentUser = await User.findByPk(req.user.id, {
            include: [{ model: User, as: 'Following', attributes: ['id'] }]
        });

        const followingIds = currentUser.Following.map(user => user.id);

        const recipes = await Recipe.findAll({
            where: { userId: followingIds },
            include: [
                { model: User, as: 'author', attributes: ['id', 'username', 'avatar_url'] }
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(recipes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    followUser,
    getUserFeed,
};
