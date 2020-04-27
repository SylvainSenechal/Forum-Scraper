// https://ec56229aec51f1baff1d-185c3068e22352c56024573e929788ff.ssl.cf1.rackcdn.com/attachments/original/6/4/2/002746642.pdf

const http = require("https")
const fs = require('fs')
const credentials = require('./credentials.js')
console.log(credentials)
console.log(credentials.user)

const { Pool, Client } = require('pg')

const client = new Client({
  user: credentials.user,
  host: credentials.host,
  database: credentials.database,
  password: credentials.password,
  port: credentials.port,
})
client.connect()



let options = {
  host: 'forum.hardware.fr',
  path: '/hfr/Discussions/Loisirs/pognon-bourse-sujet_16022_11025.htm',
  method: 'GET'
}
const updatePathOptions = options => {
  let updatedURL = ''
  return new Promise((resolve, reject) => {
    let requestForMovedPermanently = http.request(options)
    requestForMovedPermanently.on('response', res => {
      console.log(`statusCode: ${res.statusCode}`)
      console.log('new location : ', res.headers.location)
      // options.path = res.headers.location
      updatedURL = res.statusCode === 301 ? res.headers.location : options.path
      resolve(updatedURL)
    })
    requestForMovedPermanently.on('error', error => {
      console.log('problem with request: ' + error.message)
      reject(err)
    })
    requestForMovedPermanently.end()
  })
}

const startScraper = async () => {
  options.path = await updatePathOptions(options)
  console.log(options.path)
  scrap()
}

startScraper()

const scrap = () => {
  let req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`)
    console.log('HEADERS: ' + JSON.stringify(res.headers))
    console.log(res.headers.location)
    res.setEncoding('utf8')

    if (res.statusCode !== 200) console.log('FAILED')

    let data = ''
    res.on('data', chunk => {
      // console.log(chunk)
      data += chunk
    })
    res.on('end', () => {
      let infos = {
        namePoster: '',
        idPost: '',
        datePost: '',
        timePost: '',
        messageContent: '',
        quoting: [] // liste des messages quotés dans ce post, compter le nombre de messages quoté après
      }
      // TODO: choper la numero page
      // TODO: voir si y a besoin des slices ou juste de commencer le for au bon endroit ?
      // let date = new Date()
      console.log('fini')

      let messagePosition = data.search('messagetable')
      data = data.slice(messagePosition)

      let idPostPosition = data.search('<a name="t') + 10 // + 10 removes <a name="t
      data = data.slice(idPostPosition)
      let endIdPostPosition = data.search('"></a>')
      for (let id = 0; id < endIdPostPosition; id++) {
        infos.idPost += data[id]
      }

      let namePosterPosition = data.search('s2') + 4 // + 4 removes s2">
      data = data.slice(namePosterPosition)
      let endNamePosterPosition = data.search('</b>')
      for (let letterName = 0; letterName < endNamePosterPosition; letterName++) {
        if (data[letterName].charCodeAt(0) !== 8203) {
          infos.namePoster += data[letterName]
        }
      }



      let messageDatePosition = data.search('Posté le ') + 9 // + 9 removes Posté le
      data = data.slice(messageDatePosition)
      for (let datePosition = 0; datePosition < 10; datePosition++) {
        infos.datePost += data[datePosition]
      }

      let dataMessageDatePosition = data.search('à') + 7 // +7 removes à&nbsp;
      data = data.slice(dataMessageDatePosition)
      for (let timePostion = 0; timePostion < 8; timePostion++) {
        infos.timePost += data[timePostion]
      }

      let endMessagePosition = data.search('clear: both')
      let quotedMessageIdPosition = data.search('htm#t') + 5
      data = data.slice(quotedMessageIdPosition)
      let endQuotedMessageIdPosition = data.search('" class')
      let quoted = {idPost: '', namePoster: ''}
      for (let id = 0; id < endQuotedMessageIdPosition; id++) {
        quoted.idPost += data[id]
      }
      let nameQuotedPosterPosition = data.search('"Topic">') + 8
      data = data.slice(nameQuotedPosterPosition)
      let endNameQuotedPosterPosition = data.search(' a écrit')
      for (let letterName = 0; letterName < endNameQuotedPosterPosition; letterName++) {
        quoted.namePoster += data[letterName]
      }
      infos.quoting.push(quoted)

      // // let messageContentPosition = data.search('para' + infos.idPost)
      // let messageContentPosition = data.search('para' + infos.idPost)
      // data = data.slice(messageContentPosition)
      // let endMessageContentPosition = data.search('</td>')
      // for (let content = 0; content < endMessageContentPosition; content++) {
      //   infos.messageContent += data[content]
      // }



      console.log(infos)

      quoted = {idPost: '', namePoster: ''}
      nameQuotedPosterPosition = data.search('"Topic">') + 8
      data = data.slice(nameQuotedPosterPosition)
      endNameQuotedPosterPosition = data.search(' a écrit')
      for (let letterName = 0; letterName < endNameQuotedPosterPosition; letterName++) {
        quoted.namePoster += data[letterName]
      }
      console.log(quoted)
      quoted = {idPost: '', namePoster: ''}
      nameQuotedPosterPosition = data.search('"Topic">') + 8
      data = data.slice(nameQuotedPosterPosition)
      endNameQuotedPosterPosition = data.search(' a écrit')
      for (let letterName = 0; letterName < endNameQuotedPosterPosition; letterName++) {
        quoted.namePoster += data[letterName]
      }
      console.log(quoted)

      // client.query('INSERT INTO users (id, name, email) VALUES ($1, $2, $3)', [infos.idPost, infos.namePoster, infos.messageContent], (err, res) => {
      //   console.log(err, res)
      //   // console.log(res.rows)
      //   // console.log(res.rows[0].name)
      //   // client.end()
      // })
      // client.query('SELECT * FROM users', (err, res) => {
      //   // console.log(err, res)
      //   console.log(res.rows)
      //   console.log(res.rows[0].name)
      //   client.end()
      // })
    })
  })

  req.on('error', error => {
    console.log('problem with request: ' + error.message)
  })

  req.end()

}
