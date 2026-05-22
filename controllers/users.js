const usersRouter = require ('express').Router()
const bcrypt = require ('bcryptjs')
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
    const users = await User.find({}).populate('blogs', {title:1, likes:1, url:1,author:1})
    response.json(users)
})

usersRouter.post('/', async (request, response) => {
    const {username, name, password} = request.body

    //validaciones basicas
    if(! username || ! password) {
        return response.status(400).json({error: 'username and password are required'})
    }

    if(username.length < 3 ){
        return response.status(400).json({error: 'username must be at least 3 character long'})
    }

    if(password.length < 3 ){
        return response.status(400).json({error: 'password must be at least 3 character long'})
    }
    // verificar que el usuario existe
    const existingUser = await User.findOne({username})
    if (existingUser) {
        return response.status(400).json({error: 'username must be unique'})
    }
    
    //encriptar la contrasenia
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    //crear el usuario
    const user = new User ({
        username,
        name,
        passwordHash
    })
    
    const savedUser = await user.save()
    response.status(201).json(savedUser)

})


module.exports = usersRouter