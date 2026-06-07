const jwt = require ('jsonwebtoken')
const config = require ('./config')

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
            request.user = decodedToken}
     catch (error){
        
     }
    }
    next()
}

module.exports = {
    tokenExtractor,
    userExtractor
}