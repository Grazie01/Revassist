const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbconfig');
const { Review } = require('./Flashcard_Review');
const { Student } = require('./Student');

const StudentReview = sequelize.define('StudentReview', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  time_taken: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  number_of_questions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  review_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  review_key: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: Review,
        key: 'id',
    },
  },
  student_key: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: Student,
        key: 'id',
    },
  }
});

const createStudentReviewTable = async () => {
  try {
    await StudentReview.sync();
    console.log("StudentReview table created or already exists.");
  } catch (error) {
    console.error("Error creating StudentReview table:", error);
  }
};

module.exports = {
    StudentReview,
    createStudentReviewTable,
};
