const {test, describe, after, beforeEach} = require ('node:test')
const assert = require('node:assert')
const supertest = require('supertest')
const app = require ('../app')
const Blog = require ('../models/blog')
const mongoose = require ('mongoose')

const api = supertest(app)

const initialBlogs = [
    {
      title: 'Go To Statement Considered Harmful',
      author: 'Edsger W. Dijkstra',
      url: 'https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf',
      likes: 5
    },
    {
      title: 'React patterns',
      author: 'Michael Chan',
      url: 'https://reactpatterns.com/',
      likes: 7
    }
   
  ]

beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})


describe('Blog api tests', () => {
    test('blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })
    test('all blogs are returned', async () => {
        const response = await api.get('/api/blogs')
        assert.strictEqual(response.body.length,initialBlogs.length)
    })
    test('the unique identifier property is named "id"', async () => {
        const response = await api.get('/api/blogs')

        response.body.forEach(blog => {
            assert(blog.id)
            assert(!blog._id)
        })
    })
})

after( async () => {
    await mongoose.connection.close()
})