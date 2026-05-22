const {test,describe, after, beforeEach} = require ('node:test')
const assert = require ('node:assert')
const supertest = require ('supertest')
const mongoose = require ('mongoose')
const bcrypt = require ('bcryptjs')
const app = require('../app')
const User = require('../models/user')

const api = supertest(app)

describe('when there is inittialy one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({username: 'root', name: 'Root User', passwordHash})

        await user.save()
    })

    test('creation succeds with a fresh username', async () => {
        const usersAtStart = await User.find({})

        const newUser = {
            username: 'testuser',
            name: 'Test User',
            password: 'password123'
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)
        
        const usersAtEnd = await User.find({})
        assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1 )
        const usernames = usersAtEnd.map (u => u.username)
        assert(usernames.includes(newUser.username))

    })

    test('users includes their blogs', async () => {
        const response = await api.get('/api/users')
        const user = response.body[0]
        //verificar que el usuario tiene la propiedad blogs
        assert(user.blogs !== undefined)
        assert(Array.isArray(user.blogs))
    })

    test('GET api users returns users', async () => {
        const response = await api
            .get('/api/users')
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const users = response.body
        assert(users.length >= 1)

        users.forEach(user => {
            assert(user.id)
            assert(!user.passwordHash)
        })
    })

    test('creation fails with proper statuscode and message if username is already taken', async () => {
        const usersAtStart = await User.find({})

        const newUser = {
            username: 'root',
            name: 'SuperUser',
            password: 'password123'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
        
        const usersAtEnd = await User.find({})
        assert(result.body.error.includes('username must be unique'))
        assert.strictEqual(usersAtStart.length, usersAtEnd.length)
    })
    test('creation fails if password is too short', async () => {
        const usersAtStart = await User.find({})

        const newUser = {
            username: 'validuser',
            name: 'Valid Name',
            password: '12'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)

        const usersAtEnd = await User.find({})
        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('creation fails if username is too short', async () => {
        const usersAtStart = await User.find({})

        const newUser = {
            username: 'AB',
            name: 'Test Name',
            password: 'password123'
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(400)

        const usersAtEnd = await User.find({})
        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    after(async () => {
        await mongoose.connection.close()
    })
})