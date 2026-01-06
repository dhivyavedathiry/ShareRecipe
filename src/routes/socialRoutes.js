const express = require('express');
const router = express.Router();
const { followUser, getUserFeed } = require('../controllers/socialController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/:id/follow', protect, followUser);
router.get('/feed', protect, getUserFeed);

module.exports = router;
