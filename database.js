import mysql from 'mysql2'

import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DATABASE
}).promise()

export const getAllProjects = async () => {
	const result = await pool.query('SELECT * FROM projects')
	return result[0]
}

export const getAProject = async (name) => {
	const result = await pool.query(`SELECT * FROM projects where name = ?`,[name])
	return result[0][0]
}

export const createAProject = async(name, description, members, link) => {
	const result = await pool.query(`INSERT INTO projects VALUES (?,?,?,?)`, [name, description, members, link]) 
	return result
}

