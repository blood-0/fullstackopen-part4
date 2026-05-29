const jwt = require ('jsonwebtoken')
const bcrypt = require ('bcryptjs')
const loginRouter = require ('express').Router()
const User = require ('../models/user')

loginRouter.post('/', async (request, response) => {
    const {username, password} = request.body

    //buscamos un user por username 
    const user = await User.findOne({username})
    const correctPassword = user === null 
        ? false
        : await bcrypt.compare(password, user.passwordHash)

    if(!(user && correctPassword)){
        return response.status(401).json({
            error: 'invalid username or password'
        })
    }

    //crear token
    const userForToken = {
        username: user.username,
        id: user.id
    }

    //expiracion del token en 3600 segundos
    const token = jwt.sign(
        userForToken,
        process.env.SECRET,
        {expiresIn: 3600}
    )
    
    response.status(200).send({
        token,
        username: user.username,
        id: user.id
    })
    
})

module.exports = loginRouter