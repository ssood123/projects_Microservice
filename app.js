import express from 'express'
import pool from './database.js'
import bodyParser from 'body-parser'
const app = express()
app.use(express.json())
app.use(bodyParser.urlencoded({
	extended: true
}))

const databaseTableName = process.env.MYSQL_DATABASE_TABLE_NAME
const errorCheckingForAddUpdate = async (name, description, members, link) => {
	const memberNames = members.split(', ')
	console.log(memberNames)
	const projects = await pool.query(`SELECT * FROM ${databaseTableName}`)
	const listOfProjects = projects[0]
	let errorMessage = ''
	listOfProjects.forEach((project) => {
		if (project.name === name) {
			errorMessage = "project name already exists"
		}
		if (project.description === description) {
			errorMessage = "project description already exists"	
		}
		if (project.link === link) {
			errorMessage = "project link alaready exists"		
		}
		for (let i = 0; i < memberNames.length; i++) {
			if (project.members.toLowerCase().includes(memberNames[i].toLowerCase())) {
				errorMessage = "At least one member is already in another group"
			}
		}
	})	
	return errorMessage
} 

app.post('/seed', async(req, res) => {
	await pool.query(`DELETE FROM ${databaseTableName}`)
	await pool.query(`INSERT INTO ${databaseTableName} (projectID, name, description, members, link) VALUES (0, 'project1', 'this is the first project', 'Ariyah Molloy, Kira Sanders, Amit Ramsay', 'project1.com')`)
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES ('project2', 'this is the second project', 'Brianna Carrillo, Mimi Power, Letitia Macleod, Ronald Villalobos', 'project2.com')`)
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES ('project3', 'this is the third project', 'Korey Weeks, Annaliese Schneider', 'project3.com')`)
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES ('project4', 'this is the fourth project', 'Ebonie Gallagher', 'project4.com')`)
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES ('project5', 'this is the fifth project', 'Mallory Park, Inaya Gates, Sam Hobbs, Jordi Wickens, Azaan Terrell, Zain Ortiz', 'project5.com')`)
	res.status(201).send('seeded database with initial values')
})

app.get('/projects', async (req, res) => {
	const projects = await pool.query(`SELECT * FROM ${databaseTableName}`)
	res.json(projects[0])
})

app.get('/projects/:name', async (req, res) => {
	const project = await pool.query(`SELECT * FROM projects where name = ?`,[req.params.name])
	if (project[0][0]) {
		res.json(project[0][0])
	} else {
		res.status(404).json({status: "error", message: "project does not exist"})
	}
})

app.post('/projects', async (req, res) => {
	const {name, description, members, link} = req.body
	const errorMessage = errorCheckingForAddUpdate(name, description, members, link)
	if (errorMessage === '') {
		res.status(201).json({status: "success", message: "successfully added new project"})
	} else {
		res.status(401).json({status: "error", message: errorMessage})		
	}

})

app.put('/projects/:name', async (req, res) => {
	const {name, description, members, link} = req.body
	const errorMessage = errorCheckingForAddUpdate(name, description, members, link)
	if (errorMessage === '') {
		res.status(201).json({status: "success", message: "successfully updated new project"})
	} else {
		res.status(401).json({status: "error", message: errorMessage})		
	}
})

app.delete('/projects/:name', async (req, res) => {
	const {name, description, members, link} = req.body
	const errorMessage = errorCheckingForAddUpdate(name, description, members, link)
	if (errorMessage === '') {
		res.status(201).json({status: "success", message: "successfully updated new project"})
	} else {
		res.status(401).json({status: "error", message: errorMessage})		
	}
})

app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).send('Something broke!')
})

app.listen(8080, () => {
	console.log('server is running on port 8080 ')
})