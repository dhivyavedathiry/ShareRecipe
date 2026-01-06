const { Collection, Recipe } = require('../models');

// @desc    Create a collection
// @route   POST /api/collections
// @access  Private

const createCollection = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Please add a collection name' });
        }

        const collection = await Collection.create({
            userId: req.user.id,
            name,
            description,
        });

        res.status(201).json(collection);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: `Failed: UserID=${req.user ? req.user.id : 'null'} Name=${req.body ? req.body.name : 'null'}. Error: ${error.message}`
        });
    }
};

// @desc    Get user collections
// @route   GET /api/collections
// @access  Private
const getCollections = async (req, res) => {
    try {
        const collections = await Collection.findAll({
            where: { userId: req.user.id },
            include: [{ model: Recipe, as: 'recipes', attributes: ['id', 'title', 'image_url'] }]
        });

        res.json(collections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add recipe to collection
// @route   POST /api/collections/:id/recipes
// @access  Private
const addRecipeToCollection = async (req, res) => {
    try {
        const collection = await Collection.findByPk(req.params.id);
        const { recipeId } = req.body;

        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (collection.userId !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const recipe = await Recipe.findByPk(recipeId);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        await collection.addRecipe(recipe);

        res.json({ message: 'Recipe added to collection' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Remove recipe from collection
// @route   DELETE /api/collections/:id/recipes/:recipeId
// @access  Private
const removeRecipeFromCollection = async (req, res) => {
    try {
        const collection = await Collection.findByPk(req.params.id);

        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (collection.userId !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const recipe = await Recipe.findByPk(req.params.recipeId);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        await collection.removeRecipe(recipe);

        res.json({ message: 'Recipe removed from collection' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete collection
// @route   DELETE /api/collections/:id
// @access  Private
const deleteCollection = async (req, res) => {
    try {
        const collection = await Collection.findByPk(req.params.id);

        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        if (collection.userId !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await collection.destroy();
        res.json({ message: 'Collection deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createCollection,
    getCollections,
    addRecipeToCollection,
    removeRecipeFromCollection,
    deleteCollection,
};
