const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbconfig');
const { Assessment } = require('./Assessment');
const { Student } = require('./Student');

const StudentAssessment = sequelize.define('StudentAssessments', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  recorded_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  assessment_key: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Assessment,
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
  },
  total_time_taken: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '00:00:00',
  },
  total_confidence_level: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  review_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

const createStudentAssessmentsTable = async () => {
  try {
    await StudentAssessment.sync();
    console.log("StudentAssessments table created or already exists.");
  } catch (error) {
    console.error("Error creating StudentAssessments table:", error);
  }
};

module.exports = {
    StudentAssessment,
    createStudentAssessmentsTable,
};
