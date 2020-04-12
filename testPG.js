// psql command line : https://blog.logrocket.com/setting-up-a-restful-api-with-node-js-and-postgresql-d96d6fc892d8/
// pgadmin4 https:     www.digitalocean.com/community/tutorials/how-to-install-configure-pgadmin4-server-mode
// path: '/hfr/Discussions/Loisirs/pognon-bourse-monter-sujet_16022_11025.htm',

const { Pool, Client } = require('pg')
// const pool = new Pool({
//   user: 'me',
//   host: 'localhost',
//   database: 'coucou2',
//   password: 'password',
//   port: 5432,
// })
// pool.query('SELECT NOW()', (err, res) => {
//   console.log(err, res)
//   pool.end()
// })
const client = new Client({
  user: 'me',
  host: 'localhost',
  database: 'coucou3',
  password: 'password',
  port: 5432,
})
client.connect()
client.query('INSERT INTO users (name, email) VALUES ($1, $2)', ['vincent', 'oui@hotmail.com'], (err, res) => {
  console.log(err, res)
  // console.log(res.rows)
  // console.log(res.rows[0].name)
  // client.end()
})
// client.query('DROP TABLE oho')
// client.query('CREATE DATABASE coucou3')
client.query('CREATE TABLE users (ID SERIAL PRIMARY KEY, name VARCHAR(30), email VARCHAR(30));')
client.query('SELECT * FROM users', (err, res) => {
  // console.log(err, res)
  console.log(res.rows)
  console.log(res.rows[0].name)
  client.end()
})
