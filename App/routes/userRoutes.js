const express = require('express');
const path = require('path');
const userRouter = express.Router();
const path = require('path');
const { loginUser, getUser } = require(path.resolve(__dirname,'../controllers/StudentController')); 

userRouter.post('/login', loginUser);
userRouter.get('/get-student/:studentId', getUser)


module.exports = userRouter;