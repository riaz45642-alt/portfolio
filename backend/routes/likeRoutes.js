const express = require('express');
const router = express.Router();
const { getLikes, addLike } = require('../controllers/likeController');

router.get('/', getLikes);
router.post('/', addLike);

module.exports = router;
