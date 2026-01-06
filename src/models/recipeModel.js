const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./userModel');

const Recipe = sequelize.define('Recipe', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    ingredients: {
        type: DataTypes.JSON, // Stores array of strings or objects
        allowNull: false,
        defaultValue: [],
    },
    instructions: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    cooking_time: {
        type: DataTypes.INTEGER, // in minutes
        allowNull: false,
    },
    servings: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    difficulty: {
        type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
        defaultValue: 'Medium',
    },
    dietary_tags: {
        type: DataTypes.JSON, // Stores array like ['Vegetarian', 'Gluten-Free']
        allowNull: true,
        defaultValue: [],
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
});

// Association will be defined in strict/models/index.js if we use one central file, 
// or we can define simple ones here. 
// For better organization, let's keep associations in a central init block or right here if simple.
// Recipe.belongsTo(User, { foreignKey: 'userId', as: 'author' });

module.exports = Recipe;
