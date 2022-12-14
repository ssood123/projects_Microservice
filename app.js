import express from 'express'
import pool from './database.js'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import cors from 'cors'
import axios from 'axios'
import AWS from 'aws-sdk'
dotenv.config()
const app = express()
app.use(express.json())
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(
	cors({
		origin: "*",
		credentials: true
	})
)

const databaseTableName = process.env.MYSQL_DATABASE_TABLE_NAME

const baseURL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' + process.env.SAFE_BROWSING_LOOKUP_API_KEY
const requestBody = 
  {
    "client": {
      "clientId":      "matching",
      "clientVersion": "1.5.2"
    },
    "threatInfo": {
      "threatTypes":      ["MALWARE", "SOCIAL_ENGINEERING"],
      "platformTypes":    ["WINDOWS", "LINUX"],
      "threatEntryTypes": ["URL"],
      "threatEntries": [
        {"url": ""}
      ]
    }
  }


app.get('/seed', async(req, res) => {
	await pool.query(`DELETE FROM ${databaseTableName}`)
	await pool.query(`INSERT INTO ${databaseTableName} (projectID, name, description, members, link) VALUES (0, 'project1', 'this is the first project', 'ab1234, bc1234, cd1234', 'project1.com')`)
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES ('project2', 'this is the second project', 'ef1234, gh1234, ij1234, kl1234', 'project2.com')`)
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES ('project3', 'this is the third project', 'mn1234, op1234', 'project3.com')`)
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES ('project4', 'this is the fourth project', 'qr1234', 'project4.com')`)
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES ('project5', 'this is the fifth project', 'st1234, uv1234, wx1234, yz1234, at1234, zo1234', 'project5.com')`)
	res.status(201).json({status: "success", message: "seeded database with initial values"})
})

app.get('/test', async (req, res) => {
	res.status(201).json({status: "success", message: "You have successfully connected"})
})

app.get('/projects', async (req, res) => {
	const projects = await pool.query(`SELECT * FROM ${databaseTableName}`)
	let filteredProjects = []
	if (req.query.limit) {
		let offset = req.query.offset ? parseInt(req.query.offset) : 0
		for (let i = offset; i < offset + parseInt(req.query.limit); i++) {
			filteredProjects.push(projects[0][i].name)
		}
	} else {
		for (let i = 0; i < projects[0].length; i++) {
			filteredProjects.push(projects[0][i].name)
		}
	}
	let sendResponse = {}
	sendResponse['statusCode'] = 200
	sendResponse['data'] = filteredProjects
	let HATEOASlinks = []
	HATEOASlinks.push({"href" : "/projects", "rel": "self", "type": "GET"})
	HATEOASlinks.push({"href" : "/projects", "rel": "self", "type": "POST"})
	sendResponse['links'] = HATEOASlinks
	res.status(200).json(sendResponse)
})

const beforeIt = (req, res, next) => {
	console.log("POST /projects has been called!")
	next()
}

const postHandler = async (req, res, next) => {
	const {name, description, unis, link} = req.body
	requestBody.threatInfo.threatEntries[0].url = link
	let safeStatus = await axios.post(baseURL,requestBody)
	if (JSON.stringify(safeStatus.data) !== '{}') {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = 'unsafe project link'
		res.status(400).json(sendResponse)
		return		
	}
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES (?, ?, ?, ?)`, [name, description, unis, link])
	let sendResponse = {}
	sendResponse['statusCode'] = 201
	sendResponse['message'] = "successfully created new project"
	res.status(201).json(sendResponse)	
	next()
}

const afterIt = async (req, res) => {
		// Set region
		AWS.config.update({accessKeyId: process.env.ACCESS_KEY_ID, secretAccessKey: process.env.SECRET_ACCESS_KEY, region: process.env.REGION});

		// Create publish parameters

		let params = {
		  Message: 'POST /projects called!', /* required */
		  TopicArn: process.env.TOPICARN,
		};

		// Create promise and SNS service object
		let publishTextPromise = new AWS.SNS().publish(params).promise();

		// Handle promise's fulfilled/rejected states
		publishTextPromise.then(
		  function(data) {
		    console.log(`Message ${params.Message} sent to the topic ${params.TopicArn}`);
		    console.log("MessageID is " + data.MessageId);
		  }).catch(
		    function(err) {
		    console.error(err, err.stack);
  		});
}

app.post('/projects',beforeIt, postHandler, afterIt)

app.get('/projects/:name', async (req, res) => {
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])
	if (project[0][0]) {
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		sendResponse['data'] = project[0][0].description
		let HATEOASlinks = []
		HATEOASlinks.push({"href": `/projects/${req.params.name}`, "rel" : "self", "type": "GET"})
		HATEOASlinks.push({"href": `/projects/${req.params.name}/members`, "rel" : "members", "type" : "GET"})
		HATEOASlinks.push({"href": `/projects/${req.params.name}/link`, "rel" : "link", "type" : "GET"})
		sendResponse['links'] = HATEOASlinks
		res.status(200).json(sendResponse)
	}	else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "project with given name does not exist"
		res.status(400).json(sendResponse)
	}
})

app.put('/projects/:name', async (req, res) => {
	const { name, description } = req.body
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])	
	if (project[0][0]) {
		await pool.query(`UPDATE ${databaseTableName} SET name = ?, description = ? WHERE projectID = ${project[0][0].projectID}`, [name, description]);
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		sendResponse['message'] = 'successfully updated existing project name and description'
		res.status(200).json(sendResponse)		
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "project with given name does not exist"
		res.status(400).json(sendResponse)
	}
})

app.delete('/projects/:name', async (req, res) => {
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])	
	if (project[0][0]) {
		await pool.query(`DELETE FROM ${databaseTableName} WHERE name = ?`, [req.params.name])
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		sendResponse['message'] = "successfully deleted project"
		res.status(200).json(sendResponse)
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "project with given name does not exist"
		res.status(404).json(sendResponse)
	}
})

app.get('/projects/:name/members', async (req, res) => {
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])
	if (project[0][0]) {
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		let filteredMembers = []
		if (req.query.limit) {
			let offset = req.query.offset ? parseInt(req.query.offset) : 0
			let tempMembers = project[0][0].members.split(', ')
			for (let i = offset; i < offset + parseInt(req.query.limit); i++) {
				filteredMembers.push(tempMembers[i])
			}
			filteredMembers = filteredMembers.join(', ')
		} else {
			filteredMembers = project[0][0].members
		}
		sendResponse['data'] = filteredMembers
		let HATEOASlinks = []
		HATEOASlinks.push({"href": `/projects/${req.params.name}/members`, "rel" : "self", "type" : "GET"})
		HATEOASlinks.push({"href": `/projects/${req.params.name}`, "rel" : "description", "type": "GET"})
		HATEOASlinks.push({"href": `/projects/${req.params.name}/link`, "rel" : "link", "type" : "GET"})
		sendResponse['links'] = HATEOASlinks
		res.status(200).json(sendResponse)
	}	else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "project with given name does not exist"
		res.status(400).json(sendResponse)
	}
})

app.put('/projects/:name/members', async (req, res) => {
	const { unis } = req.body
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])	
	if (project[0][0]) {
		await pool.query(`UPDATE ${databaseTableName} SET members = ? WHERE projectID = ${project[0][0].projectID}`, [unis]);
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		sendResponse['message'] = "successfully updated existing project members"
		res.status(200).json(sendResponse)		
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "project with given name does not exist"
		res.status(400).json(sendResponse)
	}
})


app.delete('/projects/:name/members/:uni', async (req, res) => {
	const uni = req.params.uni
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])
	if (project[0][0]) {
		let tempMembers = project[0][0].members
		if (tempMembers.includes(uni)) {
			let tempMembers2 = tempMembers.split(', ')
			let tempMembers3 = tempMembers2.filter((e) => {
				return e !== uni
			})
			let tempMembers4 = tempMembers3.join(', ')
			await pool.query(`UPDATE ${databaseTableName} SET members = ? WHERE projectID = ${project[0][0].projectID}`, [tempMembers4]);		
			let sendResponse = {}
			sendResponse['statusCode'] = 200
			sendResponse['message'] = "successfully deleted member from project with given name"
			res.status(200).json(sendResponse)
			return
		} else {
			let sendResponse = {}
			sendResponse['statusCode'] = 400
			sendResponse['message'] = "the project with given name's members list doesn't contain specified member"
			res.status(400).json(sendResponse)
			return
		}
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "project with given name does not exist"
		res.status(400).json(sendResponse)
	}		
})

app.get('/projects/:name/link', async (req, res) => {
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])
	if (project[0][0]) {
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		sendResponse['data'] = project[0][0].link
		let HATEOASlinks = []
		HATEOASlinks.push({"href": `/projects/${req.params.name}/link`, "rel" : "self", "type" : "GET"})
		HATEOASlinks.push({"href": `/projects/${req.params.name}/members`, "rel" : "members", "type" : "GET"})
		HATEOASlinks.push({"href": `/projects/${req.params.name}`, "rel" : "description", "type": "GET"})
		sendResponse['links'] = HATEOASlinks
		res.status(200).json(sendResponse)
	}	else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "project with given name does not exist"
		res.status(400).json(sendResponse)
	}	
})

app.put('/projects/:name/link', async (req, res) => {
	const { link } = req.body
	requestBody.threatInfo.threatEntries[0].url = link
	let safeStatus = await axios.post(baseURL,requestBody)
	if (JSON.stringify(safeStatus.data) !== '{}') {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = 'unsafe project link'
		res.status(400).json(sendResponse)
		return		
	}
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])	
	if (project[0][0]) {
		await pool.query(`UPDATE ${databaseTableName} SET link = ? WHERE projectID = ${project[0][0].projectID}`, [link]);
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		sendResponse['message'] = "successfully updated existing project link"
		res.status(200).json(sendResponse)		
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "project with given name does not exist"
		res.status(400).json(sendResponse)
	}
})

app.delete('/projects/:name/link', async (req, res) => {
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])
	if (project[0][0]) {
		await pool.query(`UPDATE ${databaseTableName} SET link = ? WHERE projectID = ${project[0][0].projectID}`, ['']);
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		sendResponse['message'] = "successfully deleted existing project's link"
		res.status(200).json(sendResponse)				
	}	else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "project with given name does not exist"
		res.status(200).json(sendResponse)			
	}
})

app.get('/projects/:id/id', async (req, res) => {
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where projectID = ?`,[req.params.id])
	if (project[0][0]) {
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		sendResponse['data'] = project[0][0]
		let HATEOASlinks = []
		HATEOASlinks.push({"href": `/projects/${req.params.id}/id`, "rel" : "self", "type" : "GET"})
		sendResponse['links'] = HATEOASlinks
		res.status(200).json(sendResponse)
	}	else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "project with given id does not exist"
		res.status(400).json(sendResponse)
	}
})


app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).send({status: "error", message: "Something broke!"})
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
	console.log(`server is running on port ${PORT}`)
})