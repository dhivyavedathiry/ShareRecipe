const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const fs = require('fs');

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files using absolute path

// Explicitly serve index.html on root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Database Connection and Sync
const { sequelize, connectDB } = require('./src/config/database');
require('./src/models'); // Import models to register them


// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/users', require('./src/routes/socialRoutes')); // Mount social routes on /api/users
app.use('/api/recipes', require('./src/routes/recipeRoutes'));
app.use('/api/collections', require('./src/routes/collectionRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));








connectDB().then(() => {
    // Sync models
    sequelize.sync({ force: false }) // force: false preserves existing tables
        .then(() => console.log('Database synced'))
        .catch(err => console.error('Error syncing database:', err));

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
