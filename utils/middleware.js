const jwt = require ('jsonwebtoken')
const config = require ('./config')
const User = require('../models/user') 

const tokenExtractor = (request, response, next) => {
    const authorization = request.get('authorization')

    if (authorization && authorization.startsWith('Bearer')){
        request.token = authorization.replace('Bearer ', '')
    }
    next()
}

const userExtractor = async (request,response,next) => {
    if (request.token) {
        try {
            const decodedToken = jwt.verify (request.token, config.SECRET)
            const user = await User.findById(decodedToken.id)
            request.user = user} //guardar el usuario en request
     catch (error){
        
     }
    }
    next()
}

module.exports = {
    tokenExtractor,
    userExtractor
}