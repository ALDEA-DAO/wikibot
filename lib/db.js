require('dotenv').config()
const Pool = require('pg').Pool

const pool = new Pool({
  user: process.env.PGSQL_USER,
  host: process.env.PGSQL_HOST,
  database: process.env.PGSQL_DATABASE,
  password: process.env.PGSQL_PASSWORD,
  port: process.env.PGSQL_PORT
});

const getStakes = () => {
  console.log(pool);
  return new Promise(function(resolve, reject) {
    pool.query('SELECT * FROM allowed', (error, results) => {
      if (error) {
        reject(error)
      }
      resolve(results);
    })
  }) 
}

module.exports = {
  getStakes
}