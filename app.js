import express from 'express'
import {getAllProjects, getAProject, createAProject} from './database.js'
const app = express()

app.use(express.json())

app.get('/projects', async (req, res) => {
	const projects = await getAllProjects()
	res.send(projects)
})

app.get('/project/:name', async (req, res) => {
	const name = req.params.name
	const project = await getAProject(name);
	res.send(project)
})

app.post('projects', async (req, res) => {
	const {name, description, members, link} = req.body
	const result = await createAProject(name, description, members, link)
	res.status(201).send(result)
})
app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).send('Something broke!')
})

app.listen(8080, () => {
	console.log('server is running on port 8080 ')
})