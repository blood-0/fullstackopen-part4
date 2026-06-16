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
    

    if(!request.user){
        return response.status(401).json({error: 'user not found'})
    }

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0,
        user: request.user.id
    })
    const savedBlog = await blog.save()

    // agregar el blog al array de blogs del usuario
    request.user.blogs = request.user.blogs.concat(savedBlog.id)
    await request.user.save()

    // populate para devolver el blog con la info del usuario
    const populatedBlog = await Blog.findById(savedBlog.id).populate('user', {username: 1,name: 1})
    response.status(201).json(populatedBlog)
})

blogsRouter.delete('/:id', async (request, response) => {
    const id = request.params.id
    
    try{
        if (!request.token){
            return response.status(401).json({error:'token missing'})
        }
        //verificar que el token es valido
        let decodedToken
        try{    
            decodedToken = jwt.verify(request.token, config.SECRET)
        } catch(error){
            return response.status(401).json({error:'token invalid'})
        }
        //buscar el blog a eliminar 
        const blog = await Blog.findById(id)
        if (!blog){
            response.status(404).json({error:'blog not found'})
        }
        if (!request.user){
            return response.status(401).json({error:'user not found'})
        }
        //verificar que el usuario que quiere eliminar es el creador
        //blog.user es un objeto, lo convertimos en string
        if (blog.user.toString() !== decodedToken.id.toString()){
            return response.status(401).json({error:'only the creator can delete this blog'})
        }

        //eliminar el blog del array de blogs del usuario
        request.user.blogs = request.user.blogs.filter(
            blogId => blogId.toString() !==id
        )
        await request.user.save()
        
        // eliminar el blog
        await Blog.findByIdAndDelete(id)
        response.status(204).end()
    }catch (error){
        response.status(400).json({error:'malformated id'})
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