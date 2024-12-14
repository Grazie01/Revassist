const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('../../config/dbconfig'));
console.log('Resolved Review Path:', path.resolve(__dirname, './Flashcard_Review'));
console.log('Resolved Student Path:', path.resolve(__dirname, './Student'));

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}
const { Review } = require(path.resolve(__dirname, './Flashcard_Review'));
const { Student } = require(path.resolve(__dirname, './Student'));

const StudentReview = sequelize.define('StudentReview', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
});

module.exports = {
    StudentReview,
};
