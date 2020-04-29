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

const computeOptions = (pageNumber, nameTopic) => {
  return {
    host: 'forum.hardware.fr',
    path: `${nameTopic}${pageNumber}.htm`,
    method: 'GET'
  }
}

let pageNumber = 11026
let nameTopic = '/hfr/Discussions/Loisirs/pognon-bourse-sujet_16022_'
let options = computeOptions(pageNumber, nameTopic)

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
  let newURL = await updatePathOptions(options)
  nameTopic = newURL.match(/\/hfr\/Discussions\/Loisirs\/[a-z-_]*16022_/)[0]
  options = computeOptions (pageNumber, nameTopic)

  let lastPageMessage = (await client.query('SELECT * FROM message ORDER BY idMessage DESC LIMIT 1')).rows[0].pagenumber
  console.log(lastPageMessage)
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
      data += chunk
    })
    res.on('end', async () => {
      console.log('Get Request Done')
      let newMessages = true
      while (newMessages === true) {
        let {updatedData, infos} = getOneMessage(data)
        data = updatedData
        if (infos === 'noMoreMessage') {
          console.log('no more messages')
          newMessages = false
        } else {
          // console.log(infos)
          await client.query('INSERT INTO poster (pseudo) VALUES ($1) on conflict(pseudo) do nothing', [infos.namePoster])
          await client.query(
            'INSERT INTO message (idMessage, writter, dateMessage, timeMessage, pageNumber, messageContent) VALUES ($1, $2, $3, $4, $5, $6) on conflict(idMessage) do nothing',
            [infos.idPost, infos.namePoster, infos.datePost, infos.timePost, 11025, '']
          )
        }
      }
      req.end()
    })
  })

  req.on('error', error => {
    console.log('problem with request: ' + error.message)
  })
  req.end()
}

const getOneMessage = data => {
  let infos = {
    namePoster: '',
    idPost: '',
    datePost: '',
    timePost: '',
    messageContent: '',
    quoting: [] // liste des messages quotés dans ce post, compter le nombre de messages quoté après
  }


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

  // let endMessagePosition = data.search('clear: both')
  // let messageContentPosition = data.search('para' + infos.idPost)
  // data = data.slice(messageContentPosition)
  // let endMessageContentPosition = data.search('</td>')
  // for (let content = 0; content < endMessageContentPosition; content++) {
  //   infos.messageContent += data[content]
  // }

  let quotedMessageIdPosition = data.search('htm#t') + 5
  let endMessagePosition = data.search('clear: both')
  // console.log(quotedMessageIdPosition)
  // console.log(endMessagePosition)
  if (quotedMessageIdPosition < endMessagePosition && quotedMessageIdPosition !== -1 + 5) {
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
  }

  if (endMessagePosition === -1) return {updatedData: data, infos: 'noMoreMessage'}
  return {updatedData: data, infos: infos}
}


// (function my_func() {
//     // your code
//     console.log('oui')
//     setTimeout( my_func, 1000 );
// })();

// async function demo() {
//   console.log('Taking a break...');
//   await new Promise(r => setTimeout(r, 2000));
//
//   console.log('Two seconds later, showing sleep in a loop...');
//
//   // Sleep in loop
//   for (let i = 0; i < 6; i++) {
//     if (i === 3)
//     await new Promise(r => setTimeout(r, 2000));
//
//     console.log(i);
//   }
// }
//
// demo();
