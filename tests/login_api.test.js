const {test, describe, beforeEach, after} = require ('node:test')
const assert = require ('node:assert')
const supertest = require ('supertest')
const mongoose = require ('mongoose')
const bcrypt = require ('bcryptjs')
const app = require ('../app')
const User = require ('../models/user')

const api = supertest(app)

describe('Login API test', () => {
    beforeEach (async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('password123', 10)
        const user = new User ({
            username:'testuser',
            name: 'Test User',
            passwordHash
        })

        await user.save()
    })
    test('login succeds with correct credentials', async () => {
        const userInfo = {
            username: 'testuser',
            password: 'password123'
        }

        const response = await api
            .post('/api/login')
            .send(userInfo)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        //verificamos que exista el token
        assert(response.body.token)
        assert(response.body.id)
        assert.strictEqual(response.body.username, 'testuser')
    })
    test('login fails with wrong password', async () => {
        const logingInfo = {
            username: 'testuser',
            password: 'wrongpassword'
        }

        const response = await api
            .post('/api/login')
            .send(logingInfo)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        assert(!response.body.token)
        assert(response.body.error)
    })
    test('Login fails with non-existent username', async () => {
        const logingInfo = {
            username: 'wrongusername',
            password: 'password123'
        }
        const response = await api
            .post('/api/login')
            .send(logingInfo)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        assert(!response.body.token)
        assert(response.body.error)
    })

})
after(async () => {
    mongoose.connection.close()
})