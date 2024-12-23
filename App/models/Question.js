const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('./config/dbconfig'));
console.log('Resolved Assessment Path:', path.resolve(__dirname,'/Assessment'));

const { DataTypes } = require('sequelize');
const sequelize = require(path.resolve('./config/dbconfig')); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}
const { Assessment } = require(path.resolve(__dirname, './Assessment'));

const AssessmentQuestion = sequelize.define('assessmentquestions', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  query: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  answer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assessment_key: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: Assessment,
        key: 'id',
    },
  },
});

module.exports = {
    AssessmentQuestion,
};
