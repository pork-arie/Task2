require('dotenv').config()
const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const cookie = require('cookie-parser')
const app = express()

const authroute = require('./route/auth')
const postroute = require('./route/post')
const commentroute = require('./route/comments')
const usersroute = require('./route/users')

const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cookie())
app.use(express.static(path.join(__dirname,"..","public")))

app.use('/api/auth',authroute)
app.use('/api/post',postroute)
app.use('/api/comments',commentroute)
app.use('/api/users',usersroute)

app.get('/api/test', (req,res) => {
    res.status(200).json({message:`test in port ${PORT}`})
})

app.use('/api', (req,res) => {
    res.status(404).json({error:"Route not found"})
})

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("db connected")
        app.listen(PORT,() =>console.log(`working in port ${PORT}`))
    })
    .catch((err) => {
        console.error("db error", err.message)
        process.exit(1)
    })
