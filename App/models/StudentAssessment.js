const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('../../config/dbconfig'));
console.log('Resolved Assessment Path:', path.resolve(__dirname, './Assessment'));
console.log('Resolved Student Path:', path.resolve(__dirname, './Student'));

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}
const { Assessment } = require(path.resolve(__dirname, './Assessment'));
const { Student } = require(path.resolve(__dirname, './Student'));

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
    await StudentAssessment.sync({ alter: true });
    console.log("StudentAssessments table created or already exists.");
  } catch (error) {
    console.error("Error creating StudentAssessments table:", error);
  }
};

module.exports = {
    StudentAssessment,
    createStudentAssessmentsTable,
};
