const { Correctdialoguereplies } = require("./correctdialoguereplies");
const { Endingdialogue } = require("./endingdialogue");
const { Simulation } = require("./Simulation");
const { SimulationDialogue } = require("./Simulation_Dialogues");
const { StudentSimulation } = require("./Student_Simulation");

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

    // Simulation - StudentSimulation - SimulationDialogues
    Simulation.hasMany(StudentSimulation, {
        foreignKey: 'simulation_key',
        as: 'student_simulations',
    });

    Simulation.hasMany(SimulationDialogue, {
        foreignKey: 'simulation_key',
        as: 'simulations_dialogues',
    });

    StudentSimulation.belongsTo(Simulation, {
        foreignKey: 'simulation_key',
        as: 'simulation',
    });

    SimulationDialogue.belongsTo(Simulation, {
        foreignKey: 'simulation_key',
        as: 'simulation',
    })

    Correctdialoguereplies.belongsTo(SimulationDialogue, {
        foreignKey: 'simulation_dialogues_key',
        as: 'simulation_dialogues'
    })

    SimulationDialogue.hasOne(Correctdialoguereplies, {
        foreignKey: 'simulation_dialogues_key',
        as: 'correctdialogue_key'
    })

    Endingdialogue.belongsTo(Simulation, {
        foreignKey: 'scenario_key',
        as: 'simulation'
    })

    Simulation.hasOne(Endingdialogue, {
        foreignKey: 'scenario_key',
        as: 'ending_dialogue_key'
    })
};

module.exports = setupAssociations;
