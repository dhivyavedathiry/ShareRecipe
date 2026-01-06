const { Sequelize } = require('sequelize');
require('dotenv').config();

// Debug: Log connection parameters (remove in production)
console.log('Connecting to PostgreSQL with:', {
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432
});

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false, // Set to console.log to see SQL queries
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Database connected...');
    } catch (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
