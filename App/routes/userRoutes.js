const express = require('express');
const userRouter = express.Router();
const {loginUser, getUser} = require('../controllers/StudentController')

userRouter.post('/login', loginUser);
userRouter.get('/get-student/:studentId', getUser)


module.exports = userRouter;