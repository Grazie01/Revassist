const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('../../config/dbconfig'));
console.log('Resolved Review Path:', path.resolve(__dirname,'./Flashcard_Review'));

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}
const { Review } = require(path.resolve(__dirname, './Flashcard_Review'));

const ReviewQuestion = sequelize.define('reviewquestions', {
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
  flashcard_key: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: Review,
        key: 'id',
    },
  },
});

module.exports = {
    ReviewQuestion,
};
