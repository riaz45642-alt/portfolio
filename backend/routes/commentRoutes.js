const express = require('express');
const router = express.Router();
const { getComments, addComment, likeComment } = require('../controllers/commentController');

router.get('/', getComments);
router.post('/', addComment);
router.post('/:id/like', likeComment);

module.exports = router;
