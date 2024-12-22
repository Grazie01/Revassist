const express = require('express');
const { getLesson, getVideo } = require(path.resolve(__dirname,'../controllers/LessonController'));
const lessonRouter = express.Router();

lessonRouter.get('/:topicid/:lessonid', getLesson);
lessonRouter.post('/getVideo', getVideo);

module.exports = lessonRouter;