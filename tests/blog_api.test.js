const {test, describe, after, beforeEach} = require ('node:test')
const assert = require('node:assert')
const supertest = require('supertest')
const app = require ('../app')
const Blog = require ('../models/blog')
const User = require ('../models/user')
const mongoose = require ('mongoose')
const bcrypt = require('bcryptjs')

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
let testUserId = null // variable para guardar el ID del usuario de prueba

beforeEach(async () => {
    // limpiar las colecciones
    await Blog.deleteMany({})
    await User.deleteMany({})

    //creamos un usuario de prueba

    const passwordHash = await bcrypt.hash('password123', 10)
    const testUser = new User ({
        username: 'testuser',
        name: 'Test User',
        passwordHash
    })
    const savedUser = await testUser.save()
    testUserId = savedUser.id

    //Crear blogs asociados al usuario
    const blogsObjects = initialBlogs.map(blog => new Blog({
        ...blog,
        user: testUserId
    }))
    const savedBlogs = await Promise.all(blogsObjects.map(blog => blog.save()))

    // Asociar los blogs al usuario
    const blogIds = savedBlogs.map(blog => blog.id)
    testUser.blogs = blogIds
    await testUser.save()
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

    test('blogs have user information populated', async () => {
        const response = await api.get('/api/blogs')
        const firstBlog = response.body[0]

        // verificamos que el blog tiene la info de usuario
        assert(firstBlog.user)
        assert(firstBlog.user.id)
        assert(firstBlog.user.username)
        assert.strictEqual(firstBlog.user.username,'testuser')
    })
    test('the unique identifier property is named "id"', async () => {
        const response = await api.get('/api/blogs')

        response.body.forEach(blog => {
            assert(blog.id)
            assert(!blog._id)
        })
    })
    test('a valid blog can be added', async () => {
        const newBlog = {
            title: 'Test blog for POST',
            author: 'Test Author',
            url: 'http://testurl.com',
            likes: 15
        }
        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
            .expect('Content-Type',/application\/json/)
        
        const response = await api.get('/api/blogs')

        assert.strictEqual(response.body.length, initialBlogs.length + 1)
        
        const titles = response.body.map(blog => blog.title)
        assert(titles.includes('Test blog for POST'))
    })
    test('if likes property is missing, it defaults to zero', async () => {
        const newBlogWithoutLikes = {
            title: 'Blog without likes',
            author: 'Author without likes',
            url: 'http://nolikes.com'
        }
        const postResponse = await api
            .post('/api/blogs')
            .send(newBlogWithoutLikes)
            .expect(201)
            .expect('Content-Type', /application\/json/)
        
        assert.strictEqual(postResponse.body.likes, 0)

        const response = await api.get('/api/blogs')
        const createdBlog = response.body.find(blog => blog.title === 'Blog without likes')
        assert.strictEqual(createdBlog.likes, 0)
    })
    test('creating a blog without a title returns 400 Bad Request', async () => {
        const blogWithoutTitle = {
            author: 'Author without title',
            url:'http://withouttitle.com',
            likes: 5
        }
        await api
            .post('/api/blogs')
            .send(blogWithoutTitle)
            .expect(400)
        
        const response = await api.get('/api/blogs')
        assert.strictEqual(response.body.length, initialBlogs.length)
    })

    test('creating blog without url returns 400 Bad Request', async () => {
        const blogWithoutUrl = {
            title: 'Blog Without URL',
            author: 'Author without url',
            likes:5
        }

        await api
            .post('/api/blogs')
            .send(blogWithoutUrl)
            .expect(400)
        
        const response = await api.get('/api/blogs')
        assert.strictEqual(response.body.length, initialBlogs.length)
    })
})

describe('deleting a blog', () => {
    test('succeds with status code 204 if id is valid', async () => {
        //Obtener todos los blogs para tener un ip valido
        const blogAtStart = await api.get('/api/blogs')
        const blogToDelete = blogAtStart.body[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`) // borramos el blog
            .expect(204)
        
        //verificamos que el blog ya no existe
        const blogsAtEnd = await api.get('/api/blogs') 
        assert.strictEqual(blogsAtEnd.body.length, initialBlogs.length -1)

        // verificar que el blog ya no esta en la lista
        const titles = blogsAtEnd.body.map(blog => blog.title)
        assert(!titles.includes(blogToDelete.title))

    })
    test('returns 404 if blog does not exist', async () => {
        const nonExistingId = '5a422aa71b54a676234d17f8' // este id no existe en initialBlogs

        await api
            .delete(`/api/blogs/${nonExistingId}`)
            .expect(404)
        //verificamos que el blog no cambio
        const blogsAtEnd = await api.get('/api/blogs')
        assert.strictEqual(blogsAtEnd.body.length, initialBlogs.length)
    })
    test('returns 400 if id is malformated', async () => {
        const malformatedId = '1234'

        await api
            .delete(`/api/blogs/${malformatedId}`)
            .expect(400)
        //verificamos que el numero de blogs sigue igual
        const blogsAtEnd = await api.get('/api/blogs')
        assert.strictEqual(blogsAtEnd.body.length, initialBlogs.length)
    })
    test('returns 400 if id is malformated', async () => {
        const malformatedId = '1234'
        
        await api
            .delete(`/api/blogs/${malformatedId}`)
            .expect(400)
        
        const blogsAtEnd = await api.get('/api/blogs')
        assert.strictEqual(blogsAtEnd.body.length, initialBlogs.length)
    })    

})

describe('updating a blog', () => {
    test('succeeds with status code 200 and updates blog', async () => {
        //primero obtenemos un blog existente
        const blogAtStart = await api.get('/api/blogs')
        const blogToUpdate = blogAtStart.body[0]
        const originalLikes = blogToUpdate.likes
        
        //datos a actualizar(nuevos datos)
        const updatedData = {
            ...blogToUpdate,
            likes: originalLikes + 10
        }

        //actualizamos el blog
        const response = await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send(updatedData)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        //verificamos que la respuesta tiene los nuevos likes
        assert.strictEqual(response.body.likes, originalLikes + 10)
        assert.strictEqual(response.body.id, blogToUpdate.id)
        assert.strictEqual(response.body.title, blogToUpdate.title)
    })
    test('returns 404 if blog does not exist', async () => {
        const nonExistingId = '5a422aa71b54a676234d17f8'
        
        const updatedData = {
            title: 'Non existent',
            author: 'Nobody',
            url: 'http://nonexistingurl.com',
            likes: 10
        }

        await api
            .put(`/api/blogs/${nonExistingId}`)
            .send(updatedData)
            .expect(404)
        
        const blogAtEnd = await api.get('/api/blogs')
        assert.strictEqual(blogAtEnd.body.length, initialBlogs.length)
    })
    test('returns 400 if id is malformated', async () => {
        const malformatedId = '1234'

        const updatedData = {
            title: 'Test',
            author: 'Author test',
            url: 'htpp://test.com',
            likes: 10
        }
        //actualizamos
        await api
            .put(`/api/blogs/${malformatedId}`)
            .send(updatedData)
            .expect(400)
        
        const blogsAtEnd = await api.get('/api/blogs')
        assert.strictEqual(blogsAtEnd.body.length, initialBlogs.length)
    })
    test('can update only specific fields', async () => {
        const blogAtStart = await api.get('/api/blogs')
        const blogToUpdate = blogAtStart.body[0]

        const partialUpdate = {
            likes: 100
        }

        const response = await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send(partialUpdate)
            .expect(200)
        
        assert.strictEqual(response.body.likes, 100)
        assert.strictEqual(response.body.title, blogToUpdate.title)
        assert.strictEqual(response.body.author, blogToUpdate.author)
        assert.strictEqual(response.body.url, blogToUpdate.url)

        const blogsAtEnd = await api.get('/api/blogs')
        const updatedBlog = blogsAtEnd.body.find(blog => blog.id === blogToUpdate.id)

        assert.strictEqual(updatedBlog.likes, 100)
        assert.strictEqual(updatedBlog.title, blogToUpdate.title)
    })

})

after( async () => {
    await mongoose.connection.close()
})