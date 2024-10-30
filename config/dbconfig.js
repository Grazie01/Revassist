const { Sequelize } = require('sequelize');
const config = require('./sequelizeconfig');

const env = process.env.NODE_ENV || 'development'; // Default to development
const dbConfig = config[env];

// Create an instance of Sequelize with the database information
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false,
});

// Function to create the database if it does not exist
const createDatabaseIfNotExists = async () => {
  const tempConnection = new Sequelize(
    'mysql://root:@localhost:3306', // Connect without specifying the database
    {
      logging: false,
      dialect: 'mysql',
      dialectOptions: {
        connectTimeout: 1000,
      },
    }
  );

  try {
    // Test the connection
    await tempConnection.authenticate();
    console.log('Connection to MySQL server has been established successfully.');

    // Create the database if it does not exist
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    console.log(`Database '${dbConfig.database}' has been created or already exists.`);
    
  } catch (error) {
    console.error('Unable to connect to the MySQL server:', error);
  } finally {
    // Close the temporary connection
    await tempConnection.close();
  }
};

// Initialize the database
const initializeDatabase = async () => {
  await createDatabaseIfNotExists();
  
  try {
    await sequelize.authenticate();
    console.log('Authenticated with the database successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Export sequelize instance and initialization function
module.exports = {
  sequelize,
  initializeDatabase,
};
