const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.reduce((sum,blog) => sum + blog.likes, 0 )
}

const favoriteBlog = (blogs) => {
    if(blogs.length === 0){
        return null
    }

    const favorite = blogs.reduce((prev,current) => {
        return (prev.likes > current.likes) ? prev : current
    })
    
    return {
        title: favorite.title,
        author: favorite.author,
        likes: favorite.likes
    }
}

const mostBlogs = (blogs) => {
    if(blogs.length === 0){
        return null
    }

    const authorCounts = {}
    blogs.forEach(blog => {
        if (authorCounts[blog.author]){
            authorCounts[blog.author] += 1
        }else{
            authorCounts[blog.author] = 1
        }
    })

    let maxAuthor = ''
    let maxBlogs = 0

    for (const author in authorCounts){
        if (authorCounts[author] > maxBlogs){
            maxAuthor = author
            maxBlogs = authorCounts[author]
        }
    }
    return {
        author: maxAuthor,
        blogs: maxBlogs
    }
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs
}