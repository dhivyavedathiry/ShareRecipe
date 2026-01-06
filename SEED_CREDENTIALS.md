# Sample Login Credentials

The database has been seeded with 3 users and 6 sample recipes (2 recipes per user).

## User Accounts

### User 1: Chef Maria
- **Email:** maria@example.com
- **Password:** password123
- **Username:** chefmaria
- **Bio:** Professional chef with 10 years of experience. Love sharing authentic Italian recipes!
- **Recipes:**
  1. Classic Spaghetti Carbonara
  2. Homemade Margherita Pizza

### User 2: Baking Buddy
- **Email:** baker@example.com
- **Password:** password123
- **Username:** bakingbuddy
- **Bio:** Passionate home baker. Specializing in desserts and pastries.
- **Recipes:**
  1. Chocolate Chip Cookies
  2. Vanilla Cupcakes with Buttercream

### User 3: Veggie Chef
- **Email:** veggie@example.com
- **Password:** password123
- **Username:** veggiechef
- **Bio:** Plant-based cooking enthusiast. Creating delicious vegan and vegetarian recipes.
- **Recipes:**
  1. Quinoa Buddha Bowl
  2. Creamy Vegan Pasta Alfredo

  1. Quinoa Buddha Bowl
  2. Creamy Vegan Pasta Alfredo

### User 4: Admin
- **Email:** admin@sharecipe.com
- **Password:** adminpassword
- **Role:** admin
- **Bio:** System Administrator

## How to Use

1. Start the server: `node server.js`
2. Open the application in your browser
3. Click "Login" and use any of the credentials above
4. Browse recipes from all users in the "Browse" section
5. View your own recipes in "My Recipes" section

## Re-seeding the Database

If you need to reset the database with fresh sample data, run:
```bash
npm run seed
```

This will clear existing data and create fresh sample users and recipes.

