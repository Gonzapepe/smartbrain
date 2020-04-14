const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')


app.use(cors())

app.use(bodyParser.json())

const port = process.env.PORT || 3001

app.use('/', require('./routes/app'))

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})