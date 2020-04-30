// https://ec56229aec51f1baff1d-185c3068e22352c56024573e929788ff.ssl.cf1.rackcdn.com/attachments/original/6/4/2/002746642.pdf

const http = require("https")
const fs = require('fs')
const credentials = require('./credentials.js')
const { Client } = require('pg')

const client = new Client({
  user: credentials.user,
  host: credentials.host,
  database: credentials.database,
  password: credentials.password,
  port: credentials.port,
})
client.connect()

const MAX_MESSAGE_PER_PAGE = 40 // TODO: gerer redondance premier message doublé
const DEFAULT_PAGE_NUMBER = 11025
const URL_infos = {
  pageNumber: DEFAULT_PAGE_NUMBER,
  nameTopic: '/hfr/Discussions/Loisirs/pognon-bourse-sujet_16022_'
}

const computeOptions = () => {
  return {
    host: 'forum.hardware.fr',
    path: `${URL_infos.nameTopic}${URL_infos.pageNumber}.htm`,
    method: 'GET'
  }
}

const getPageNumber = async () => {
  try {
    pageNumber = (await client.query('SELECT * FROM message ORDER BY idMessage DESC LIMIT 1')).rows[0].pagenumber
  } catch (error) {
    pageNumber = DEFAULT_PAGE_NUMBER
  }
  return pageNumber
}

// const updatePageNumber = async () => {
//   let numberOfMessageOnCurrentPage = (await client.query('SELECT COUNT(*) FROM message WHERE pageNumber = $1', [URL_infos.pageNumber])).rows[0].count
//   console.log(numberOfMessageOnCurrentPage)
//   if (numberOfMessageOnCurrentPage >= MAX_MESSAGE_PER_PAGE) URL_infos.pageNumber += 1
// }

const handleMovePermanently = () => {
  let options = computeOptions()

  let updatedURL = ''
  return new Promise((resolve, reject) => {
    let requestForMovedPermanently = http.request(options)
    requestForMovedPermanently.on('response', res => {
      console.log(`Status Code for moved permanently test : ${res.statusCode}`)
      console.log(`New URL location : ${res.headers.location}`)
      // updatedURL = res.statusCode === 301 ? res.headers.location : options.path
      // newNameTopic = updatedURL.match(/\/hfr\/Discussions\/Loisirs\/[a-z-_]*16022_/)[0]
      // resolve(newNameTopic)
      res.statusCode === 301 ? resolve(res.headers.location.match(/\/hfr\/Discussions\/Loisirs\/[a-z-_]*16022_/)[0])
       : resolve(URL_infos.nameTopic)
      // newNameTopic = updatedURL.match(/\/hfr\/Discussions\/Loisirs\/[a-z-_]*16022_/)[0]
      // resolve(newNameTopic)
    })
    requestForMovedPermanently.on('error', error => {
      console.log('Problem with test moved permanently request: ' + error.message)
      reject(err)
    })
    requestForMovedPermanently.end()
  })
}

const startScraper = async () => {
  URL_infos.pageNumber = await getPageNumber()
  for (let i = 0; i < 20; i++) {
    console.log()
    URL_infos.nameTopic = await handleMovePermanently()
    console.log(URL_infos.nameTopic)
    let options = computeOptions()
    console.log(options)
    let incrementNewPage = await scrap(options)
    URL_infos.pageNumber += incrementNewPage
    console.log(URL_infos.pageNumber)
  }
}

startScraper()

const scrap = options => {
  return new Promise ((resolve, reject) => {
    let request = http.request(options, result => {
      result.setEncoding('utf8')
      console.log(`Scraping Status Code: ${result.statusCode}`)
      // console.log('HEADERS: ' + JSON.stringify(result.headers))
      if (result.statusCode !== 200) console.log('FAILED')

      let data = ''
      result.on('data', chunk => {
        data += chunk
      })
      result.on('end', async () => {
        let incrementNewPage = data.match(new RegExp(parseInt(URL_infos.pageNumber) + 1)) === null ? 0 : 1

        let newMessages = true
        while (newMessages === true) {
          let {updatedData, infos} = getOneMessage(data)
          data = updatedData
          if (infos === 'noMoreMessage') {
            newMessages = false
          } else {
            await client.query('INSERT INTO poster (pseudo) VALUES ($1) on conflict(pseudo) do nothing', [infos.namePoster])
            await client.query(
              'INSERT INTO message (idMessage, writter, dateMessage, timeMessage, pageNumber, messageContent) VALUES ($1, $2, $3, $4, $5, $6) on conflict(idMessage) do nothing',
              [infos.idPost, infos.namePoster, infos.datePost, infos.timePost, infos.pageNumber, '']
            )
          }
        }
        request.end()
        resolve(incrementNewPage)
      })
    })
    request.on('error', error => {
      console.log('problem with request: ' + error.message)
      reject()
    })
    request.end()
  })
}

const getOneMessage = data => {
  // let pageNumber = data.match(/<b>[0-9]*<\/b>/)[0] // Search for page number in page
  // pageNumber = pageNumber.match(/[0-9]+/)[0] // remove <b> </b>
  // console.log(pageNumber)

  let infos = {
    namePoster: '',
    idPost: '',
    datePost: '',
    timePost: '',
    pageNumber: URL_infos.pageNumber,
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


// SELECT idmessage, writter, datemessage, timemessage, pagenumber, messagecontent
// 	FROM public.message, poster
// 	WHERE writter = pseudo and pseudo = 'kiwai10';


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
