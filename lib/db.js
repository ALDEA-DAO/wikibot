require("dotenv").config();
const Pool = require("pg").Pool;

const pool = new Pool({
  user: process.env.PGSQL_USER,
  host: process.env.PGSQL_HOST,
  database: process.env.PGSQL_DATABASE,
  password: process.env.PGSQL_PASSWORD,
  port: process.env.PGSQL_PORT,
});

const getSpecRewards = (stakeSpec) => {
  return new Promise(function (resolve, reject) {
    const select = "SELECT SUM (mayz_rewards) AS rewards FROM spec_snapshots WHERE stake_addr = $1 AND claimed = false;";
    const values = [stakeSpec];
    pool.query(select, values, (error, results) => {
      if (error) {
        reject(error);
      }
      resolve(results.rows);
    });
  });
};

const getIspoRewards = (stakeIspo) => {
  return new Promise(function (resolve, reject) {
    const select = "SELECT * FROM loyalty2 WHERE address = $1;";
    const values = [stakeIspo];
    pool.query(select, values, (error, results) => {
      if (error) {
        reject(error);
      }
      resolve(results.rows);
    });
  });
};

module.exports = {
  getSpecRewards,
  getIspoRewards,
};
