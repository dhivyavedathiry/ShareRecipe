const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable params from parent router
const { addReview, getReviews } = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getReviews)
    .post(protect, addReview);

module.exports = router;
