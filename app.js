import express from 'express'
import pool from './database.js'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import cors from 'cors'
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
	for (let i = 0; i < projects[0].length; i++) {
		filteredProjects.push(projects[0][i].name)
	}
	res.status(201).json(filteredProjects)
})

app.post('/projects', async (req, res) => {
	const {name, description, unis, link} = req.body
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES (?, ?, ?, ?)`, [name, description, unis, link])
	res.status(201).json({status: "success", message: "successfully added new project"})	
})

app.get('/projects/:name', async (req, res) => {
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])
	if (project[0][0]) {
		res.status(201).json(project[0][0])
	} else {
		res.status(404).json({status: "error", message: "project with given name does not exist"})
	}
})

app.put('/projects/:name', async (req, res) => {
	const {name, description, unis, link} = req.body
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])
	if (project[0][0]) {
		await pool.query(`UPDATE ${databaseTableName} SET name = ?, description = ?, members = ?, link = ? WHERE projectID = ${project[0][0].projectID}`, [name, description, unis, link]);
		res.status(201).json({status: "success", message: "successfully updated existing project"})	
	} else {
		res.status(404).json({status: "error", message: "project with given name does not exist"})
	}
})

app.delete('/projects/:name', async (req, res) => {
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])
	if (project[0][0]) {
		await pool.query(`DELETE FROM ${databaseTableName} WHERE name = ?`, [req.params.name])
		res.status(201).json({status: "success", message: "successfully deleted project"})
	} else {
		res.status(404).json({status: "error", message: "project with given name does not exist"})
	}
})

app.get('/projects/members/:uni', async (req, res) => {
	const uni = req.params.uni
	const projects = await pool.query(`SELECT * FROM ${databaseTableName}`)
	for (let i = 0; i < projects[0].length; i++) {
		let members = projects[0][i].members.split(', ')
		for (let j = 0; j < members.length; j++) {
			if (members[j] === uni) {
				res.status(201).json(projects[0][i])
				return;
			}			
		}
	}
	res.status(404).json({status: "error", message: "project containing the member does not exist"})
})

app.put('/projects/members/:uni', async (req, res) => {
	const {name, description, unis, link} = req.body
	const uni = req.params.uni
	const projects = await pool.query(`SELECT * FROM ${databaseTableName}`)
	for (let i = 0; i < projects[0].length; i++) {
		let members = projects[0][i].members.split(', ')
		for (let j = 0; j < members.length; j++) {
			if (members[j] === uni) {
				await pool.query(`UPDATE ${databaseTableName} SET name = ?, description = ?, members = ?, link = ? WHERE projectID = ${projects[0][i].projectID}`, [name, description, unis, link]);
				res.status(201).json({status: "success", message: "successfully updated existing project"})	
				return;
			}			
		}
	}
	res.status(404).json({status: "error", message: "project containing the member does not exist"})
})

app.delete('/projects/members/:uni', async (req, res) => {
	const {name, description, unis, link} = req.body
	const uni = req.params.uni
	const projects = await pool.query(`SELECT * FROM ${databaseTableName}`)
	for (let i = 0; i < projects[0].length; i++) {
		let members = projects[0][i].members.split(', ')
		for (let j = 0; j < members.length; j++) {
			if (members[j] === uni) {
				await pool.query(`DELETE FROM ${databaseTableName} WHERE projectID = ?`, [projects[0][i].projectID])
				res.status(201).json({status: "success", message: "successfully deleted project"})
				return;
			}			
		}
	}
	res.status(404).json({status: "error", message: "project containing the member does not exist"})
})

app.get('/projects/link/:link', async (req, res) => {
	const link = req.params.link
	const projects = await pool.query(`SELECT * FROM ${databaseTableName}`)
	for (let i = 0; i < projects[0].length; i++) {
		if (projects[0][i].link === link) {
			res.status(201).json(projects[0][i])
			return;
		}			
	}
	res.status(404).json({status: "error", message: "project containing the link does not exist"})	
})

app.put('/projects/link/:link', async (req, res) => {
	const {name, description, unis, link} = req.body
	const projectLink = req.params.link
	const projects = await pool.query(`SELECT * FROM ${databaseTableName}`)
	for (let i = 0; i < projects[0].length; i++) {
		if (projects[0][i].link === projectLink) {
			await pool.query(`UPDATE ${databaseTableName} SET name = ?, description = ?, members = ?, link = ? WHERE projectID = ${projects[0][i].projectID}`, [name, description, unis, link]);
			res.status(201).json({status: "success", message: "successfully updated existing project"})	
			return;
		}			
	}
	res.status(404).json({status: "error", message: "project containing the link does not exist"})	
})

app.delete('/projects/link/:link', async (req, res) => {
	const {name, description, unis, link} = req.body
	const projectLink = req.params.link
	const projects = await pool.query(`SELECT * FROM ${databaseTableName}`)
	for (let i = 0; i < projects[0].length; i++) {
		if (projects[0][i].link === projectLink) {
			await pool.query(`DELETE FROM ${databaseTableName} WHERE projectID = ?`, [projects[0][i].projectID])
			res.status(201).json({status: "success", message: "successfully deleted project"})
			return;
		}			
	}
	res.status(404).json({status: "error", message: "project containing the link does not exist"})	
})


app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).send({status: "error", message: "Something broke!"})
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
	console.log(`server is running on port ${PORT}`)
})