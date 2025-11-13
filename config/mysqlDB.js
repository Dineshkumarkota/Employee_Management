const knex = require('knex');
const knexConfig = require('./config');

let dbInstance = null;
function getKnexInstance() {
  if (!dbInstance) {
    dbInstance = knex(knexConfig.db);
  }
  return dbInstance;
}

const db = getKnexInstance();
module.exports = db;