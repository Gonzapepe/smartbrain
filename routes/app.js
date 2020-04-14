const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const { Pool } = require('pg')

const config = {
    user: 'postgres',
    host: 'localhost',
    password: 'overseer07',
    database: 'smartbrain'
}

const pool = new Pool( config )

router.get('/', async (req, res) => {
    try {
        const text = 'SELECT * FROM users'
        
        const users = await pool.query(text)
        console.log(users)
        res.json(users.rows)
    } catch (err) {
        res.json(err)
    }
})

router.post('/signin', async (req, res) => {      

    try {
        
        const { password, email } = req.body
        if (!email || !password) {
            return res.status(400).json('incorrect form submission');
          }
        const user = await pool.query('SELECT hash, email FROM login WHERE email = $1', [email])
        console.log(user.rows[0])
        const isValid = bcrypt.compareSync(password, user.rows[0].hash);
        if(isValid) {
            const loggedIn = await pool.query('SELECT * FROM users WHERE email = $1', [email])
            res.json(loggedIn.rows[0]) 
        } else {
            res.status(400).json('Wrong user')
        }

    } catch (err) {
        
    }

})


router.post('/register', async (req, res) => {
    const { email, password, name } = req.body
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    console.log(hash)
    if (!email || !name || !password) {
        return res.status(400).json('incorrect form submission');
      }
    const client = await pool.connect()
    
    try {
        
        await client.query('BEGIN')
        const queryUsers = 'INSERT INTO users (email, name, joined) VALUES ($1, $2, $3) RETURNING *'
        const response = await client.query(queryUsers, [email, name, new Date()])

        const queryLogin = 'INSERT INTO login (id, hash, email) VALUES ($1, $2, $3) RETURNING *'
        const queryValue = [response.rows[0].id, hash, email ]
        await client.query(queryLogin, queryValue)
        await client.query('COMMIT')

        const lastQuery =  await client.query('SELECT * FROM users ORDER BY ID DESC LIMIT 1')
        res.json(lastQuery.rows[0])

    } catch (err) {
        res.status(400).json(err)
    }
    
})

router.put('/image', async (req, res) => {
    try {
        const { id } = req.body
        const { rows } = await pool.query('UPDATE users SET entries = entries + 1 WHERE id = $1 RETURNING entries', [id])
        res.json(rows[0].entries)

    } catch (err) {
        res.status(400).send(err)
    }
    
})

router.get('/profile/:id', async (req, res) => {
    try {
    const { id } = req.params
    const query = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    if(query.rows) {
        res.json(query.rows)
    } else {
        res.send('Not found')
    }

    
    } catch (err) {
        res.status(400).send('User does not exist')
    }

})

module.exports = router