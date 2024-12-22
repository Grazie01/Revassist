const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

require('dotenv').config();

const { Student } = require(path.resolve(__dirname, './App/models/Student'));
const { Lesson } = require(path.resolve(__dirname, './App/models/Lesson'));
const { Assessment } = require(path.resolve(__dirname, './App/models/Assessment'));
const { AssessmentQuestion } = require(path.resolve(__dirname, './App/models/Question'));
const { ReviewQuestion } = require(path.resolve(__dirname, './App/models/Flashcard_Questions'));
const { Review } = require(path.resolve(__dirname, './App/models/Flashcard_Review'));
const { StudentAssessment } = require(path.resolve(__dirname, './App/models/StudentAssessment'));
const { StudentReview } = require(path.resolve(__dirname, './App/models/Student_Review'));
const { Topic } = require(path.resolve(__dirname, './App/models/Topic'));
const userRouter = require(path.resolve(__dirname, './App/routes/userRoutes'));
const topicRouter = require(path.resolve(__dirname, './App/routes/topicRoutes'));
const setupAssociations = require(path.resolve(__dirname, './App/models/Associations'));
const lessonRouter = require(path.resolve(__dirname, './App/routes/lessonRoutes'));
const reviewRouter = require(path.resolve(__dirname, './App/routes/reviewRoutes'));
const assRouter = require(path.resolve(__dirname, './App/routes/assessmentRoutes'));
const simRouter = require(path.resolve(__dirname, './App/routes/simulationRoutes'));

const PORT = process.env.PORT || 3000
const app = express();

var corsOptions = {
    origin: "https://revassist.site",
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization'], 
    credentials: true,  
};

// Middleware
app.use((req, res, next) => {
    const startTime = Date.now()
    //console.log('Request Method:', req.method);
    console.log('Request Headers:', req.headers);
    //console.log('Request Body:', req.body);
    //console.log('Request:', req);

    // Capture the response details
    const originalSend = res.send;
    res.send = function (body) {
        console.log(`Outgoing Response:`);
        console.log(`- Status Code: ${res.statusCode}`);
        console.log(`- Headers: ${JSON.stringify(res.getHeaders(), null, 2)}`);
        console.log(`- Body: ${body}`);

        originalSend.call(this, body); // Call the original `send` function
    };

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`Request completed in ${duration}ms`);
    });
    next();
});


app.use(express.json());
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });

app.options('*', cors(corsOptions));

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
