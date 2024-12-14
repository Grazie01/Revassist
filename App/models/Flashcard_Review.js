const path = require('path');
console.log('Resolved dbconfig Path:', path.resolve('../../config/dbconfig'));
console.log('Resolved Lesson Path:', path.resolve(__dirname, './Lesson'));

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/dbconfig'); 

if (!sequelize) {
  throw new Error('Sequelize instance is not initialized. Check your dbconfig.js setup.');
}
const { Lesson } = require(path.resolve(__dirname, './Lesson'));

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  time: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 60,
  },
  lesson_key: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: Lesson,
        key: 'id',
    },
  },
});


module.exports = {
    Review,
};
