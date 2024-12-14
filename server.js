const express = require('express');
const cors = require('cors');
const path = require('path'); // Import the path module for resolving paths

// Load environment variables
require('dotenv').config();

const { createStudentTable, Student } = require(path.resolve(__dirname, './App/models/Student'));
const { createLessonsTable, Lesson } = require(path.resolve(__dirname, './App/models/Lesson'));
const { createAssessmentsTable, Assessment } = require(path.resolve(__dirname, './App/models/Assessment'));
const { createAssessmentQuestionsTable, AssessmentQuestion } = require(path.resolve(__dirname, './App/models/Question'));
const { createReviewQuestionsTable, ReviewQuestion } = require(path.resolve(__dirname, './App/models/Flashcard_Questions'));
const { createReviewTable, Review } = require(path.resolve(__dirname, './App/models/Flashcard_Review'));
const { createStudentAssessmentsTable, StudentAssessment } = require(path.resolve(__dirname, './App/models/StudentAssessment'));
const { createStudentReviewTable, StudentReview } = require(path.resolve(__dirname, './App/models/Student_Review'));
const { createTopicTable, Topic } = require(path.resolve(__dirname, './App/models/Topic'));
const userRouter = require(path.resolve(__dirname, './App/routes/userRoutes'));
const topicRouter = require(path.resolve(__dirname, './App/routes/topicRoutes'));
const setupAssociations = require(path.resolve(__dirname, './App/models/Associations'));
const lessonRouter = require(path.resolve(__dirname, './App/routes/lessonRoutes'));
const reviewRouter = require(path.resolve(__dirname, './App/routes/reviewRoutes'));
const assRouter = require(path.resolve(__dirname, './App/routes/assessmentRoutes'));
const { createStudentSimulationTable } = require(path.resolve(__dirname, './App/models/Student_Simulation'));
const simRouter = require(path.resolve(__dirname, './App/routes/simulationRoutes'));
const { createReviewAnswersTable } = require(path.resolve(__dirname, './App/models/ReviewAnswers'));
const { createAssessmentAnswersTable } = require(path.resolve(__dirname, './App/models/AssessmentAnswers'));
const { createSimulationAnswersTable } = require(path.resolve(__dirname, './App/models/SimulationAnswers'));

const PORT = process.env.PORT || 8080;
const app = express();

// CORS options
var corsOptions = {
    origin: "http://localhost:3000",
};

// Middleware
app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next();
});

app.use(express.json());
app.use(cors(corsOptions));
app.use(express.static(path.resolve(__dirname, 'build')));

// Routes
app.get('/', (req, res) => {
    res.status(200).send("Welcome to the root URL of Server");
});

app.use('/api/users', userRouter);
app.use('/api/topics', topicRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/review', reviewRouter);
app.use('/api/assessment', assRouter);
app.use('/api/simulations', simRouter);

require(path.resolve(__dirname, './App/models/Associations'));

const models = {
    Topic,
    Lesson,
    Assessment,
    Review,
    Student,
    StudentAssessment,
    StudentReview,
    AssessmentQuestion,
    ReviewQuestion,
};

setupAssociations(models);

const startServer = async () => {
    try {

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

        await createReviewAnswersTable();
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
