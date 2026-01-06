const { sequelize } = require('./src/config/database');
const { User, Recipe, Collection } = require('./src/models');

async function syncDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.\n');

        // Sync all models (create tables if they don't exist, but don't drop existing ones)
        console.log('Syncing database schema...');
        await sequelize.sync({ alter: true }); // alter: true will modify tables to match models

        console.log('\n✅ Database schema synced successfully!');
        console.log('\nCreated/Updated tables:');
        console.log('  - Users');
        console.log('  - Recipes');
        console.log('  - Reviews');
        console.log('  - Collections');
        console.log('  - Favorites (many-to-many junction)');
        console.log('  - CollectionRecipes (many-to-many junction)');
        console.log('  - Follows (many-to-many junction)');

        process.exit(0);
    } catch (error) {
        console.error('Error syncing database:', error);
        process.exit(1);
    }
}

syncDatabase();
