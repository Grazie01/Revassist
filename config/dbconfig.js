const { Sequelize } = require('sequelize');
const config = require('./sequelizeconfig');

const env = process.env.NODE_ENV || 'development';
console.log('Environment:', env);

const dbConfig = config[env];
console.log('Loaded DB Config:', dbConfig);

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host.trim(),
  dialect: dbConfig.dialect,
  logging: false,
});

const createDatabaseIfNotExists = async () => {
  const adminConfig = {
      username: dbConfig.username,
      password: dbConfig.password,
      host: dbConfig.host,
      dialect: dbConfig.dialect,
  };

  const tempConnection = new Sequelize(
      `mysql://${adminConfig.username}:${adminConfig.password}@${adminConfig.host}:3306`,
      {
          logging: false,
          dialect: adminConfig.dialect,
          dialectOptions: {
              connectTimeout: 1000,
          },
      }
  );

  try {
      console.log('Testing temporary connection...');
      await tempConnection.authenticate();
      console.log('Temporary connection established successfully.');

      console.log(`Creating database '${dbConfig.database}' if it does not exist...`);
      await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
      console.log(`Database '${dbConfig.database}' has been created or already exists.`);
  } catch (error) {
      console.error('Error in createDatabaseIfNotExists:', error.message);
      throw new Error(`Failed to ensure database existence: ${error.message}`);
  } finally {
      await tempConnection.close();
  }
};


(async () => {
  try {
    await createDatabaseIfNotExists();
  } catch (error) {
    console.error('Failed to ensure database existence:', error.message);
    process.exit(1);
  }
})();

console.log('Exporting Sequelize instance.');
module.exports = sequelize;
