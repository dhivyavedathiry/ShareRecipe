const express = require('express');
const router = express.Router();
const {
    createCollection,
    getCollections,
    addRecipeToCollection,
    removeRecipeFromCollection,
    deleteCollection
} = require('../controllers/collectionController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // All collection routes are private

router.route('/')
    .post(createCollection)
    .get(getCollections);

router.route('/:id')
    .delete(deleteCollection);

router.post('/:id/recipes', addRecipeToCollection);
router.delete('/:id/recipes/:recipeId', removeRecipeFromCollection);

module.exports = router;
