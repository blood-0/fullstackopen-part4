const blogsRouter = require ('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const config = require('../utils/config')

blogsRouter.get('/', async (request,response) => {
    const blogs = await Blog
        .find({})
        .populate('user', {username:1, name: 1})
        response.json(blogs)         
})

blogsRouter.post('/', async (request, response) => {
    const body = request.body

    if(!body.title || !body.url){
        return response.status(400).json({error:'title or url missing'})
    }


    if(!request.token) {
        return response.status(401).json({error:'token missing'})
    }
    //verificar el token
    let decodedToken
    try {
        decodedToken = jwt.verify(request.token, config.SECRET)
    }catch(error){
        return response.status(401).json({error: 'token invalid'})
    }
    //obtener el usuario del token
    const user = await User.findById(decodedToken.id)

    if(!user){
        return response.status(401).json({error: 'user not found'})
    }

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0,
        user: user.id
    })
    const savedBlog = await blog.save()

    // agregar el blog al array de blogs del usuario
    user.blogs = user.blogs.concat(savedBlog.id)
    await user.save()

    // populate para devolver el blog con la info del usuario
    const populatedBlog = await Blog.findById(savedBlog.id).populate('user', {username: 1,name: 1})
    response.status(201).json(populatedBlog)
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

blogsRouter.put('/:id', async (request, response) => {
    const id = request.params.id
    const body = request.body

    const updatedBlog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes : body.likes
    }
    try {
        const result = await Blog.findByIdAndUpdate(
            id,
            updatedBlog,
            {new: true, runValidators : true, context : 'query'}
        )
        if (result){
            response.json(result)
        }else{
            response.status(404).json({error: 'blog not found'})
        }
    }catch (error){
        response.status(400).json({error: 'malformated id or validation error'})
    }
})
module.exports = blogsRouter