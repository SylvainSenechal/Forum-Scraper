require('dotenv').config()
const got = require('got')
const express = require('express')
const app = express()
const port = process.env.PORT
const dbPassword = process.env.DB_PASSWORD
const dbName = process.env.DB_NAME
// app.use(bodyParser.json())

const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId
const uri = `mongodb+srv://${dbName}:${dbPassword}@cluster0.uznmv.mongodb.net/retryWrites=true&w=majority`
const client = new MongoClient(uri)

const connectDatabase = async () => {
	try {
		const connection = await client.connect()
		app.locals.database = connection.db("forumBourse")
		console.log('CONNECTED')
		app.listen(port)
		// https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
	} catch (error) {
		console.log(error)
	}
}

connectDatabase().then( () => {
	console.log('okkkk')
	scrapPages(10, 10)
})



app.get('/', (req, res) => {
	console.log('ok')
	res.send( 'ok')
})

app.use((req, res, next) => {
	const error = new Error('Not found')
	error.status = 404
	next(error)
})

app.use((error, req, res, next) => {
	res.status(error.status || 500)
	res.json({
		error: {
			message: error.message,
			error: error
		}
	})
})

// VOIR DATES TRANSFORMER EN NB
const scrapPages = async (startPage, endPage) => {
	// const db = req.app.locals.database

	const db = app.locals.database
	for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
		console.log(pageNumber)
		let page = await getPageHTML(pageNumber)
		let messages = []
		while (true) {
			let scraped = extractNextMessage(page, pageNumber)
			if (scraped.updatedData === "no message") break
			page = scraped.updatedData
			messages.push(scraped.infos)
		}

		await Promise.all(
			messages.map(async message => {
				let found = await db.collection('Messages').findOne({ 'idPost': message.idPost })
				if (!found) {
					await db.collection('Messages').insertOne(message)
				} else {
					console.log('already exists')
				}
			})
		)
	}
}

const getPageHTML = async pageNumber => {
	try {
		let response = await got(`https://forum.hardware.fr/hfr/Discussions/Loisirs/pognon-bourse-sujet_16022_${pageNumber}.htm`)
		return response.body
	} catch (error) {
		console.log(error.response.body)
	}
}



// // TODO : revoir
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*')
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-type')
//     if (req.method === 'OPTIONS') {
//         res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
//         return res.status(200).json({})
//     }
//     next()
// })


const extractNextMessage = (data, pageNumber) => {
	const infos = {
		idPost: '',
		namePoster: '',
		datePost: '',
		day: '',
		month: '', 
		year: '',
		timePost: '',
		timeNumber: '',
		pageNumber: pageNumber,
	}

	data = data.slice(data.search('messagetable'))

	data = data.slice(data.search('<a name="t') + 10) // + 10 removes <a name="t
	infos.idPost = Number(data.slice(0, data.search('"></a>')))

	data = data.slice(data.search('s2') + 4) // + 4 removes s2">
	infos.namePoster = data.slice(0, data.search('</b>'))

	data = data.slice(data.search('Posté le ') + 9) // + 9 removes Posté le
	infos.datePost = data.slice(0, 10)

	data = data.slice(data.search('à') + 7) // +7 removes à&nbsp;
	infos.timePost = data.slice(0, 8)

	const [day, month, year] = infos.datePost.split('-')
	infos.day = Number(day)
	infos.month = Number(month)
	infos.year = Number(year)

	const [hour, minute, second] = infos.timePost.split(':')
	infos.timeNumber = Number(hour) * 3600 + Number(minute) * 60 + Number(second)

	let endMessagePosition = data.search('clear: both')
	if (endMessagePosition === - 1) {
		return { updatedData: "no message", infos: infos }
	}
	return { updatedData: data, infos: infos }
}
