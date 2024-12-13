const express = require('express');
const cors = require("cors");
const { initializeDatabase } = require('./config/dbconfig'); 
const { createStudentTable, Student } = require('./App/models/Student');
const { createLessonsTable, Lesson } = require('./App/models/Lesson');
const { createAssessmentsTable, Assessment } = require('./App/models/Assessment');
const { createAssessmentQuestionsTable, AssessmentQuestion } = require('./App/models/Question');
const { createReviewQuestionsTable, ReviewQuestion } = require('./App/models/Flashcard_Questions');
const { createReviewTable, Review } = require('./App/models/Flashcard_Review');
const { createStudentAssessmentsTable, StudentAssessment } = require('./App/models/StudentAssessment');
const { createStudentReviewTable, StudentReview } = require('./App/models/Student_Review');
const { createTopicTable, Topic } = require('./App/models/Topic');
const userRouter = require('./App/routes/userRoutes');
const topicRouter = require('./App/routes/topicRoutes');
const setupAssociations = require('./App/models/Associations');
const lessonRouter = require('./App/routes/lessonRoutes');
const reviewRouter = require('./App/routes/reviewRoutes');
const assRouter = require('./App/routes/assessmentRoutes');
const { createStudentSimulationTable } = require('./App/models/Student_Simulation');
const simRouter = require('./App/routes/simulationRoutes');
const { createReviewAnswersTable } = require('./App/models/ReviewAnswers');
const { createAssessmentAnswersTable } = require('./App/models/AssessmentAnswers');
const { createSimulationAnswersTable } = require('./App/models/SimulationAnswers');

const PORT = process.env.PORT || 8080;
const app = express();

require('dotenv').config();

var corsOptions = {
    origin: "http://localhost:3000",
};

app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next();
});

app.use(express.json());
app.use(cors(corsOptions));

//app.use(express.static("build"))

app.get('/', (req, res) => {
    res.status(200).send("Welcome to the root URL of Server");
});

app.use('/api/users', userRouter);
app.use('/api/topics', topicRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/review', reviewRouter);
app.use('/api/assessment', assRouter);
app.use('/api/simulations', simRouter);

require('./App/models/Associations'); 

const models = {
    Topic,
    Lesson,
    Assessment,
    Review,
    Student,
    StudentAssessment,
    StudentReview,
    AssessmentQuestion,
    ReviewQuestion
};

setupAssociations(models);

const startServer = async () => {
    try {
        await initializeDatabase();
        
        await createStudentTable();
        await createTopicTable();
        await createLessonsTable();
        
        await createAssessmentsTable();
        await createReviewTable();
        
        await createAssessmentQuestionsTable();
        await createReviewQuestionsTable();
        await createStudentAssessmentsTable();
        await createStudentReviewTable();

        await createStudentSimulationTable();
        await createSimulationAnswersTable();

        await createReviewAnswersTable()
        await createAssessmentAnswersTable();
        
        app.listen(PORT, (error) => {
            if (!error) {
                console.log(`Server is successfully running, and app is listening on port ${PORT}`);
            } else {
                console.log("Error occurred, server can't start", error);
            }
        });
    } catch (error) {
        console.error('Error during server startup or database connection:', error);
    }
};

startServer();
