const blogsRouter = require ('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request,response) => {
    const blogs = await Blog.find({})
    response.json(blogs)            
})

blogsRouter.post('/', async (request, response) => {
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
    const savedBlog = await blog.save()
    response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
    const id = request.params.id
    
    try{
        const blog = await Blog.findByIdAndDelete(id)

        if(blog){
            response.status(204).end()
        }else{
            response.status(404).json({error:'blog not found'})
        }
    }catch(error){
        response.status(400).json({error: 'malformated id'})
    }

    
})
module.exports = blogsRouter