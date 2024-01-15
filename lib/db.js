const mysql = require('mysql');

var db_conn = mysql.createPool({
  host     : process.env.MYSQL_HOST,
  user     : process.env.MYSQL_USER,
  password : process.env.MYSQL_PASS,
  database : process.env.MYSQL_DB,
  charset   : 'utf8mb4',
  collation : 'utf8mb4_unicode_ci',
  connectionLimit : 10,
  acquireTimeout  : 10000
});
//db_conn.connect();

module.exports = {
  db_conn,
};