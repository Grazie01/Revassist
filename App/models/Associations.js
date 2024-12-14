const path = require('path');
const { AssessmentAnswers } = require(path.resolve(__dirname, './App/models/AssessmentAnswers'));
const { ReviewAnswers } = require(path.resolve(__dirname, './App/models/ReviewAnswers'));
const { SimulationAnswers } = require(path.resolve(__dirname, './App/models/SimulationAnswers'));
const { StudentSimulation } = require(path.resolve(__dirname, './App/models/Student_Simulation'));

// associations.js
const setupAssociations = (models) => {
    const {
        Lesson,
        Topic,
        Assessment,
        AssessmentQuestion,
        Review,
        ReviewQuestion,
        Student,
        StudentAssessment,
        StudentReview
    } = models;

    // Topic - Lesson
    Topic.hasMany(Lesson, {
        foreignKey: 'topic_key',
        as: 'lessons',
    });

    Topic.hasOne(Assessment, {
        foreignKey: 'topic_key',
        as: 'assessment',
    });

    Lesson.belongsTo(Topic, {
        foreignKey: 'topic_key',
        as: 'topic',
    });

    Lesson.hasOne(Review, {
        foreignKey: 'lesson_key',
        as: 'review'
    });

    // Assessment - Question
    Assessment.belongsTo(Topic, {
        foreignKey: 'module_key',
        as: 'topic',
    });

    Assessment.hasMany(AssessmentQuestion, {
        foreignKey: 'assessment_key',
        as: 'assessment_questions'
    });

    AssessmentQuestion.belongsTo(Assessment, {
        foreignKey: 'assessment_key',
        as: 'assessment',
    });

    // Review - Questions
    Review.belongsTo(Lesson, {
        foreignKey: 'lesson_key',
        as: 'lesson',
    });

    Review.hasMany(ReviewQuestion, {
        foreignKey: 'flashcard_key',
        as: 'questions'
    });

    ReviewQuestion.belongsTo(Review, {
        foreignKey: 'flashcard_key',
        as: 'review',
    });

    // Student - Review - Assessment
    Student.hasMany(StudentAssessment, {
        foreignKey: 'student_key',
        as: 'student_assessments',
    });
    
    Student.hasMany(StudentReview, {
        foreignKey: 'student_key',
        as: 'student_reviews',
    });

    StudentReview.belongsTo(Student, {
        foreignKey: 'student_key',
        as: 'student',
    });

    StudentReview.belongsTo(Review, {
        foreignKey: 'review_key',
        as: 'review',
    });

    StudentAssessment.belongsTo(Student, {
        foreignKey: 'student_key',
        as: 'student',
    });
    
    StudentAssessment.belongsTo(Assessment, {
        foreignKey: 'assessment_key',
        as: 'assessment',
    });

    StudentSimulation.belongsTo(Student, {
        foreignKey: 'student_key',
        as: 'student_simulation',
    });

    //answer - review
    ReviewQuestion.hasMany(ReviewAnswers, {
        foreignKey: 'review_question_key',
        as: 'review_answers'
    })

    ReviewAnswers.belongsTo(ReviewQuestion, {
        foreignKey: 'review_question_key',
        as: 'review_questions'
    })

    StudentReview.hasMany(ReviewAnswers, {
        foreignKey: 'review_id_key',
        as: 'answers'
    })



    //answer - assessment
    StudentAssessment.hasMany(AssessmentAnswers, {
        foreignKey: 'assessment_id_key',
        as: 'answers'
    })
    AssessmentAnswers.belongsTo(StudentAssessment, {
        foreignKey: 'assessment_id_key',
        as: 'question'
    })

    AssessmentQuestion.hasMany(AssessmentAnswers, {
        foreignKey: 'assessment_question_key',
        as: 'assessment_answer'
    })

    AssessmentAnswers.belongsTo(AssessmentQuestion, {
        foreignKey: 'assessment_question_key',
        as: 'assessment_question'
    })

    //simulation
    StudentSimulation.hasMany(SimulationAnswers, {
        foreignKey: 'student_simulation_key',
        as: 'simulation_answers'
    })

    SimulationAnswers.belongsTo(StudentSimulation, {
        foreignKey: 'student_simulation_key',
        as: 'simulation_record'
    })
};

module.exports = setupAssociations;
