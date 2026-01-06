const { Recipe, User } = require('../models');
const { Op, Sequelize } = require('sequelize');

// @desc    Create a recipe
// @route   POST /api/recipes
// @access  Private
const createRecipe = async (req, res) => {
    try {
        const { title, description, ingredients, instructions, cooking_time, servings, difficulty, dietary_tags, image_url } = req.body;

        if (!title || !description || !instructions || !cooking_time || !servings) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        const recipe = await Recipe.create({
            userId: req.user.id,
            title,
            description,
            ingredients,
            instructions,
            cooking_time,
            servings,
            difficulty,
            dietary_tags,
            image_url,
        });

        // Fetch the recipe with author information
        const recipeWithAuthor = await Recipe.findByPk(recipe.id, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'username', 'avatar_url'] }
            ]
        });

        res.status(201).json(recipeWithAuthor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all recipes with search and filters
// @route   GET /api/recipes
// @access  Public
const getRecipes = async (req, res) => {
    try {
        const { keyword, difficulty, time, dietary } = req.query;

        let whereClause = {};

        // Search by keyword (title or description)
        // Search by keyword (title, description, author, or tags)
        if (keyword) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } },
                { '$author.username$': { [Op.like]: `%${keyword}%` } }, // Search by author username
                Sequelize.where(
                    Sequelize.cast(Sequelize.col('Recipe.dietary_tags'), 'TEXT'),
                    { [Op.like]: `%${keyword}%` }
                ) // Search within dietary tags
            ];
        }

        // Filter by difficulty
        if (difficulty) {
            whereClause.difficulty = difficulty;
        }

        // Filter by max cooking time
        if (time) {
            whereClause.cooking_time = { [Op.lte]: time };
        }

        // Filter by dietary tags (JSONB containment)
        // Postgres JSONB containment: dietary_tags @> '["Vegetarian"]'
        // Filter by dietary tags
        if (dietary) {
            // Force strict string matching on the JSON column to avoid Sequelize type confusion
            whereClause[Op.and] = Sequelize.where(
                Sequelize.cast(Sequelize.col('Recipe.dietary_tags'), 'TEXT'),
                { [Op.like]: `%"${dietary}"%` }
            );
        }

        const recipes = await Recipe.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'username', 'avatar_url'],
                }
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(recipes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get single recipe
// @route   GET /api/recipes/:id
// @access  Public
const getRecipeById = async (req, res) => {
    try {
        const recipe = await Recipe.findByPk(req.params.id, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'username', 'avatar_url'] }
            ]
        });

        if (recipe) {
            res.json(recipe);
        } else {
            res.status(404).json({ message: 'Recipe not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update recipe
// @route   PUT /api/recipes/:id
// @access  Private (Owner only)
const updateRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findByPk(req.params.id);

        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        if (recipe.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { title, description, ingredients, instructions, cooking_time, servings, difficulty, dietary_tags, image_url } = req.body;

        recipe.title = title || recipe.title;
        recipe.description = description || recipe.description;
        recipe.ingredients = ingredients || recipe.ingredients;
        recipe.instructions = instructions || recipe.instructions;
        recipe.cooking_time = cooking_time || recipe.cooking_time;
        recipe.servings = servings || recipe.servings;
        recipe.difficulty = difficulty || recipe.difficulty;
        recipe.dietary_tags = dietary_tags || recipe.dietary_tags;
        recipe.image_url = image_url || recipe.image_url;

        const updatedRecipe = await recipe.save();

        // Fetch the updated recipe with author information
        const recipeWithAuthor = await Recipe.findByPk(updatedRecipe.id, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'username', 'avatar_url'] }
            ]
        });

        res.json(recipeWithAuthor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete recipe
// @route   DELETE /api/recipes/:id
// @access  Private (Owner or Admin)
const deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findByPk(req.params.id);

        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        if (recipe.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await recipe.destroy();
        res.json({ message: 'Recipe removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createRecipe,
    getRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
};
