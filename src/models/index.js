const { sequelize } = require('../config/database');
const User = require('./userModel');
const Recipe = require('./recipeModel');
const Review = require('./reviewModel');
const Collection = require('./collectionModel');

// User <-> Recipe (One-to-Many: Author)
User.hasMany(Recipe, { foreignKey: 'userId', as: 'recipes', onDelete: 'CASCADE' });
Recipe.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// User <-> Review (One-to-Many)
User.hasMany(Review, { foreignKey: 'userId', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'reviewer' });

// Recipe <-> Review (One-to-Many)
Recipe.hasMany(Review, { foreignKey: 'recipeId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Recipe, { foreignKey: 'recipeId' });

// User <-> Recipe (Many-to-Many: Favorites)
User.belongsToMany(Recipe, { through: 'Favorites', as: 'favoriteRecipes', foreignKey: 'userId' });
Recipe.belongsToMany(User, { through: 'Favorites', as: 'favoritedBy', foreignKey: 'recipeId' });

// User <-> Collection (One-to-Many)
User.hasMany(Collection, { foreignKey: 'userId', as: 'collections', onDelete: 'CASCADE' });
Collection.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// Collection <-> Recipe (Many-to-Many)
Collection.belongsToMany(Recipe, { through: 'CollectionRecipes', as: 'recipes', foreignKey: 'collectionId' });
Recipe.belongsToMany(Collection, { through: 'CollectionRecipes', as: 'collections', foreignKey: 'recipeId' });

// User <-> User (Many-to-Many: Follows)
User.belongsToMany(User, { as: 'Followers', through: 'Follows', foreignKey: 'followingId', otherKey: 'followerId' });
User.belongsToMany(User, { as: 'Following', through: 'Follows', foreignKey: 'followerId', otherKey: 'followingId' });

module.exports = {
    sequelize,
    User,
    Recipe,
    Review,
    Collection,
};
