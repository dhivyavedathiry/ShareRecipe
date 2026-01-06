const { sequelize, connectDB } = require('./src/config/database');
// Import models to register them
require('./src/models');
const { User, Recipe } = require('./src/models');

// Sample users data
const users = [
    {
        username: 'chefmaria',
        email: 'maria@example.com',
        password: 'password123',
        bio: 'Professional chef with 10 years of experience. Love sharing authentic Italian recipes!'
    },
    {
        username: 'bakingbuddy',
        email: 'baker@example.com',
        password: 'password123',
        bio: 'Passionate home baker. Specializing in desserts and pastries.'
    },
    {
        username: 'veggiechef',
        email: 'veggie@example.com',
        password: 'password123',
        bio: 'Plant-based cooking enthusiast. Creating delicious vegan and vegetarian recipes.'
    },
    {
        username: 'admin',
        email: 'admin@sharecipe.com',
        password: 'adminpassword',
        role: 'admin',
        bio: 'System Administrator'
    }
];

// Sample recipes data
const recipes = [
    // Recipes for chefmaria (user 1)
    {
        userId: 1,
        title: 'Classic Spaghetti Carbonara',
        description: 'A traditional Italian pasta dish made with eggs, cheese, pancetta, and black pepper. This creamy and rich recipe is a Roman classic that comes together in just 20 minutes.',
        ingredients: ['400g spaghetti', '200g pancetta', '4 large eggs', '100g parmesan cheese', 'Black pepper', 'Salt'],
        instructions: '1. Cook spaghetti in salted boiling water until al dente.\n2. While pasta cooks, fry pancetta until crispy.\n3. Beat eggs with grated parmesan and black pepper.\n4. Drain pasta, reserving some pasta water.\n5. Quickly mix hot pasta with pancetta, then add egg mixture off heat.\n6. Toss vigorously, adding pasta water if needed. Serve immediately.',
        cooking_time: 20,
        servings: 4,
        difficulty: 'Medium',
        dietary_tags: ['__time_range:20-25', '__servings_range:3-4', 'Italian']
    },
    {
        userId: 1,
        title: 'Homemade Margherita Pizza',
        description: 'Authentic Neapolitan-style pizza with fresh mozzarella, basil, and tomato sauce. Simple ingredients that create an incredible flavor when combined.',
        ingredients: ['500g pizza dough', '200g fresh mozzarella', '400g canned tomatoes', 'Fresh basil leaves', 'Olive oil', 'Salt'],
        instructions: '1. Preheat oven to 250°C (480°F) with pizza stone.\n2. Roll out pizza dough into a circle.\n3. Spread tomato sauce, leaving edges for crust.\n4. Tear mozzarella and distribute evenly.\n5. Drizzle with olive oil and sprinkle salt.\n6. Bake for 8-10 minutes until crust is golden.\n7. Top with fresh basil before serving.',
        cooking_time: 30,
        servings: 2,
        difficulty: 'Medium',
        dietary_tags: ['__time_range:25-35', '__servings_range:2-3', 'Italian', 'Vegetarian']
    },
    // Recipes for bakingbuddy (user 2)
    {
        userId: 2,
        title: 'Chocolate Chip Cookies',
        description: 'The perfect chewy chocolate chip cookies with crispy edges and soft centers. This recipe uses brown sugar for extra flavor and a secret ingredient for the perfect texture.',
        ingredients: ['225g butter', '150g brown sugar', '100g white sugar', '2 eggs', '1 tsp vanilla', '280g flour', '1 tsp baking soda', '1 tsp salt', '300g chocolate chips'],
        instructions: '1. Cream butter and both sugars until light and fluffy.\n2. Beat in eggs and vanilla.\n3. Mix in flour, baking soda, and salt.\n4. Fold in chocolate chips.\n5. Chill dough for at least 1 hour.\n6. Bake at 180°C (350°F) for 10-12 minutes.\n7. Let cool on baking sheet for 5 minutes before transferring.',
        cooking_time: 25,
        servings: 24,
        difficulty: 'Easy',
        dietary_tags: ['__time_range:20-30', '__servings_range:20-24', 'Dessert', 'Baking']
    },
    {
        userId: 2,
        title: 'Vanilla Cupcakes with Buttercream',
        description: 'Light and fluffy vanilla cupcakes topped with smooth buttercream frosting. Perfect for birthdays, parties, or any celebration. The recipe yields perfectly moist cupcakes every time.',
        ingredients: ['200g flour', '150g sugar', '100g butter', '2 eggs', '120ml milk', '1 tsp vanilla', '1.5 tsp baking powder', 'For frosting: 200g butter', '400g powdered sugar', '2 tbsp milk', '1 tsp vanilla'],
        instructions: '1. Preheat oven to 180°C (350°F).\n2. Cream butter and sugar, then add eggs and vanilla.\n3. Alternately add flour and milk, mixing until smooth.\n4. Fill cupcake liners 2/3 full.\n5. Bake for 18-20 minutes until golden.\n6. For frosting: Beat butter until creamy, gradually add powdered sugar, then milk and vanilla.\n7. Pipe or spread frosting on cooled cupcakes.',
        cooking_time: 40,
        servings: 12,
        difficulty: 'Medium',
        dietary_tags: ['__time_range:35-45', '__servings_range:10-12', 'Dessert', 'Baking']
    },
    // Recipes for veggiechef (user 3)
    {
        userId: 3,
        title: 'Quinoa Buddha Bowl',
        description: 'A nutritious and colorful plant-based bowl packed with protein, vegetables, and healthy grains. Customize with your favorite veggies and dressings for a satisfying meal.',
        ingredients: ['200g quinoa', '1 sweet potato', '1 bell pepper', '1 cup chickpeas', '2 cups spinach', '1 avocado', 'Olive oil', 'Lemon juice', 'Tahini', 'Salt', 'Pepper'],
        instructions: '1. Cook quinoa according to package instructions.\n2. Roast sweet potato cubes at 200°C (400°F) for 25 minutes.\n3. Sauté bell pepper until tender.\n4. Rinse and drain chickpeas, season with salt.\n5. Make dressing: mix tahini, lemon juice, olive oil, and water.\n6. Arrange quinoa in bowls, top with vegetables and chickpeas.\n7. Add sliced avocado and drizzle with dressing.',
        cooking_time: 45,
        servings: 3,
        difficulty: 'Easy',
        dietary_tags: ['__time_range:40-50', '__servings_range:2-4', 'Vegan', 'Vegetarian', 'Healthy']
    },
    {
        userId: 3,
        title: 'Creamy Vegan Pasta Alfredo',
        description: 'A rich and creamy pasta dish made entirely from plant-based ingredients. Cashews create the perfect creamy texture without any dairy. Comfort food that\'s good for you!',
        ingredients: ['400g fettuccine', '1 cup raw cashews', '2 cloves garlic', '1 cup vegetable broth', '2 tbsp nutritional yeast', '1 tsp lemon juice', 'Salt', 'Pepper', 'Fresh parsley'],
        instructions: '1. Soak cashews in hot water for 30 minutes.\n2. Cook pasta according to package directions.\n3. Drain cashews and blend with garlic, broth, nutritional yeast, and lemon juice until smooth.\n4. Heat sauce in a pan until warm and thickened.\n5. Toss cooked pasta with sauce.\n6. Season with salt and pepper.\n7. Garnish with fresh parsley and serve.',
        cooking_time: 35,
        servings: 4,
        difficulty: 'Medium',
        dietary_tags: ['__time_range:30-40', '__servings_range:3-4', 'Vegan', 'Italian']
    }
];

async function seedDatabase() {
    try {
        // Connect to database
        await connectDB();

        // Sync models (this will create tables if they don't exist)
        await sequelize.sync({ force: true }); // Set to true to drop existing tables

        console.log('Starting database seed...\n');

        // Clear existing data (optional - comment out if you want to keep existing data)
        console.log('Clearing existing data...');
        await Recipe.destroy({ where: {} });
        await User.destroy({ where: {} });

        // Create users
        console.log('Creating users...');
        const createdUsers = [];
        for (const userData of users) {
            const user = await User.create(userData);
            createdUsers.push(user);
            console.log(`✓ Created user: ${user.username} (${user.email})`);
        }

        // Update recipe userIds to match created users
        recipes.forEach((recipe, index) => {
            const userIndex = Math.floor(index / 2); // 2 recipes per user
            recipe.userId = createdUsers[userIndex].id;
        });

        // Create recipes
        console.log('\nCreating recipes...');
        for (const recipeData of recipes) {
            const recipe = await Recipe.create(recipeData);
            const user = createdUsers.find(u => u.id === recipeData.userId);
            console.log(`✓ Created recipe: "${recipe.title}" by ${user.username}`);
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📝 Sample Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        users.forEach((user, index) => {
            console.log(`\nUser ${index + 1}:`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Password: ${user.password}`);
            console.log(`  Username: ${user.username}`);
        });
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();

