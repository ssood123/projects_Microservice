import express from 'express'
import pool from './database.js'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
dotenv.config()
const app = express()
app.use(express.json())
app.use(bodyParser.urlencoded({
	extended: true
}))

const databaseTableName = process.env.MYSQL_DATABASE_TABLE_NAME
const errorCheckingForAddUpdate = async (name, description, members, link, updateFlag=false, currentName='', currentDescription='', currentMembers='', currentLink='') => {
	if (name === '') {
		return "project name can't be empty"
	}
	if (description === '') {
		return "project description can't be empty"
	}
	if (members === '') {
		return "project must have at least one member"
	}
	if (link === '') {
		return "project link can't be empty"
	}
	const memberNames = members.split(', ')
	const listOfNames = []
	for (let i = 0; i < memberNames.length -1; i++) {
		for (let j = i + 1; j < memberNames.length; j++) {
			if (memberNames[i].toLowerCase() === memberNames[j].toLowerCase()) {
				return "Duplicate members aren't allowed"
			}
		}
	}
	const projects = await pool.query(`SELECT * FROM ${databaseTableName}`)
	const listOfProjects = projects[0]
	for (const project of listOfProjects) {
		if (updateFlag === true && (project.name === currentName || project.description === currentDescription || project.members === currentMembers || project.link === currentLink)) {
			continue;
		}
		if (project.name === name) {
			return "project name already exists"
		}
		if (project.description === description) {
			return "project description already exists"	
		}
		if (project.link === link) {
			return "project link alaready exists"	
		}
		const memberNames2 = project.members.split(', ')
		for (const member of memberNames) {
			for (const member2 of memberNames2) {
				if (member.toLowerCase() === member2.toLowerCase()) {
					return "At least one member is already in another group"
				}
			}
		}
	}
	return ''
} 

app.get('/seed', async(req, res) => {
	await pool.query(`DELETE FROM ${databaseTableName}`)
	await pool.query(`INSERT INTO ${databaseTableName} (projectID, name, description, members, link) VALUES (0, 'project1', 'this is the first project', 'Ariyah Molloy, Kira Sanders, Amit Ramsay', 'project1.com')`)
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES ('project2', 'this is the second project', 'Brianna Carrillo, Mimi Power, Letitia Macleod, Ronald Villalobos', 'project2.com')`)
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES ('project3', 'this is the third project', 'Korey Weeks, Annaliese Schneider', 'project3.com')`)
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES ('project4', 'this is the fourth project', 'Ebonie Gallagher', 'project4.com')`)
	await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES ('project5', 'this is the fifth project', 'Mallory Park, Inaya Gates, Sam Hobbs, Jordi Wickens, Azaan Terrell, Zain Ortiz', 'project5.com')`)
	res.status(201).json({status: "success", message: "seeded database with initial values"})
})
app.get('/test', async (req, res) => {
	res.status(201).json({status: "success", message: "You have successfully connected"})
})

app.get('/projects', async (req, res) => {
	const projects = await pool.query(`SELECT * FROM ${databaseTableName}`)
	res.status(201).json(projects[0])
})

app.get('/projects/:name', async (req, res) => {
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])
	if (project[0][0]) {
		res.status(201).json(project[0][0])
	} else {
		res.status(404).json({status: "error", message: "project does not exist"})
	}
})

app.post('/projects', async (req, res) => {
	const {name, description, members, link} = req.body
	const errorMessage = await errorCheckingForAddUpdate(name, description, members, link)
	if (errorMessage === '') {
		await pool.query(`INSERT INTO ${databaseTableName} (name, description, members, link) VALUES (?, ?, ?, ?)`, [name, description, members, link])
		res.status(201).json({status: "success", message: "successfully added new project"})
	} else {
		res.status(401).json({status: "error", message: errorMessage})		
	}

})

app.put('/projects/:name', async (req, res) => {
	const {name, description, members, link} = req.body
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])
	if (project[0][0]) {
		const errorMessage = await errorCheckingForAddUpdate(name, description, members, link, true, project[0][0].name, project[0][0].description, project[0][0].members, project[0][0].link)
		if (errorMessage === '') {
			await pool.query(`UPDATE ${databaseTableName} SET name = ?, description = ?, members = ?, link = ? WHERE projectID = ${project[0][0].projectID}`, [name, description, members, link]);
			res.status(201).json({status: "success", message: "successfully updated existing project"})
		} else {
			res.status(401).json({status: "error", message: errorMessage})		
		}
	} else {
		res.status(404).json({status: "error", message: "project does not exist"})
	}
})

app.delete('/projects/:name', async (req, res) => {
	const project = await pool.query(`SELECT * FROM ${databaseTableName} where name = ?`,[req.params.name])
	if (project[0][0]) {
		await pool.query(`DELETE FROM ${databaseTableName} WHERE name = ?`, [req.params.name])
		res.status(201).json({status: "success", message: "successfully deleted project"})
	} else {
		res.status(404).json({status: "error", message: "project does not exist"})
	}
})

app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).send('Something broke!')
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
	console.log(`server is running on port ${PORT}`)
})