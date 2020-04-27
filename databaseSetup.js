// psql command line : https://blog.logrocket.com/setting-up-a-restful-api-with-node-js-and-postgresql-d96d6fc892d8/
// pgadmin4 https:     www.digitalocean.com/community/tutorials/how-to-install-configure-pgadmin4-server-mode
// path: '/hfr/Discussions/Loisirs/pognon-bourse-monter-sujet_16022_11025.htm',

const credentials = require('./credentials.js')

console.log(credentials)
console.log(credentials.user)

const { Client } = require('pg')

const client = new Client({
  user: credentials.user,
  host: credentials.host,
  database: credentials.database,
  password: credentials.password,
  port: credentials.port,
})

client.connect()

let dateSelector = 'SELECT current_date;'
let values = []
const createTables = async () => {
  let result = await client.query(dateSelector, values)
  await client.query(`CREATE TABLE IF NOT EXISTS poster
  (
    pseudo VARCHAR(50) PRIMARY KEY,
    inscription DATE,
    nbMessagesForum INT,
    nbMessageTopic INT,
    email VARCHAR(30)
  );`)
  await client.query(`CREATE TABLE IF NOT EXISTS message
  (
    idMessage INT PRIMARY KEY,
    writter VARCHAR(50) references poster(pseudo),
    dateMessage DATE,
    timeMessage TIMESTAMP,
    messageContent VARCHAR(80)
  );`)
  // await client.query('DROP TABLE poster')
  await client.query('INSERT INTO poster (pseudo) VALUES ($1)', ['vincent'])
  await client.query('INSERT INTO message (idMessage, writter) VALUES ($1, $2)', ['3', 'vincent'])
  client.end()
}

createTables()

// client.query('CREATE DATABASE coucou5')
