require('dotenv').config()
const Pool = require('pg').Pool

const pool = new Pool({
  user: process.env.PGSQL_USER,
  host: process.env.PGSQL_HOST,
  database: process.env.PGSQL_DATABASE,
  password: process.env.PGSQL_PASSWORD,
  port: process.env.PGSQL_PORT
});

const getStakes = (stakeKey) => {
  return new Promise(function(resolve, reject) {
    const select = 'SELECT * FROM allowed WHERE stake = $1'
    const values = [stakeKey]
    pool.query(select, values, (error, results) => {
      if (error) {
        reject(error)
      }
      resolve(results.rows);
    })
  }) 
}

module.exports = {
  getStakes
}