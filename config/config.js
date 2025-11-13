const dbPort = process.env.dbPort;
const dbHost = process.env.dbHost;
const dbName = process.env.dbName;
const dbUser = process.env.dbUser;
const dbPassword = process.env.dbPassword;

module.exports = {
  db: {
    client: "mysql2",
    connection: {
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    },
    debug: false,
    migrations: {
      tableName: "knex_migrations",
      directory: "./src/migrations",
    },
  },
};
