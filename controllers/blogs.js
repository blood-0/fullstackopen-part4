const blogsRouter = require ('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', (request,response)=>{
    Blog
        .find({})
        .then(blogs=>{
            response.json(blogs)
        })
        .catch(error=>{
            response.status(500).json({error:'Something went wrong'})
        })
})

blogsRouter.post('/',(request, response)=>{
    const body = request.body

    if(!body.title || !body.url){
        return response.status(400).json({error:'title or url missing'})
    }

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0
    })

    blog
        .save()
        .then(savedBlog=>{
            response.status(201).json(savedBlog)
        })
        .catch(error=>{
            response.status(500).json({error: 'Saving blog failed'})
        })
})

module.exports = blogsRouter