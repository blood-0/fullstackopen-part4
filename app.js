const express = require('express')
const cors= require('cors')
const mongoose = require('mongoose')
const config = require('./utils/config')
const logger = require('./utils/logger')
const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const middleware = require ('./utils/middleware')

const app = express()

mongoose.set('strictQuery', false)

logger.info('connecting to ', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI)
    .then(()=>{
        logger.info('connected to mongoDB')
    })
    .catch((error)=>{
        logger.error('error connecting to mongoDB:', error.message)
    })

app.use(cors())
app.use(express.json())
app.use(middleware.tokenExtractor) // middleware para extraer token
app.use('/api/blogs', middleware.userExtractor, blogsRouter) //userExtractor solo para la ruta blogsRouter
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)

module.exports = app