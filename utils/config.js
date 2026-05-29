require ('dotenv').config()

const PORT = process.env.PORT || 3003

const MONGODB_URI = process.env.NODE_ENV === 'test'
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI


const SECRET = process.env.SECRET
if(!SECRET) {
    console.error('ERROR: SECRET environment variable is not set')
    process.exit(1)
}

module.exports = {
    MONGODB_URI,
    PORT,
    SECRET
}