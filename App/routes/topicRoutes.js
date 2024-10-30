const express = require('express');
const topicRouter = express.Router();
const { getAllTopics } = require('../controllers/TopicController');

topicRouter.get('/get-all', getAllTopics);

module.exports = topicRouter;