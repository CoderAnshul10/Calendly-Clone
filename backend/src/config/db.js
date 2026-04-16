const { Sequelize } = require('sequelize');

// Railway provides DATABASE_URL or MYSQL_URL for MySQL
const connectionUrl =
  process.env.DATABASE_URL ||
  process.env.MYSQL_URL ||
  null;

let sequelize;

if (connectionUrl) {
  console.log('DB URL detected, connecting via URL...');
  sequelize = new Sequelize(connectionUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'false'
        ? false
        : { require: true, rejectUnauthorized: false },
    },
  });
} else {
  // Fallback to individual env vars (local development)
  console.log('No DATABASE_URL found, using individual DB env vars...');
  sequelize = new Sequelize(
    process.env.DB_NAME || 'calendly_clone2',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      dialect: 'mysql',
      logging: false,
    }
  );
}

module.exports = sequelize;