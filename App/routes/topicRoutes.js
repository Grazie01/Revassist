const express = require('express');
const path = require('path');
const topicRouter = express.Router();
const { getAllTopics } = require(path.resolve(__dirname,'../controllers/TopicController'));

topicRouter.get('/get-all', getAllTopics);

module.exports = topicRouter;