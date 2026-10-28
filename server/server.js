const express = require('express')
const path = require('path')
const app = express()


app.use(express.json())
app.use(express.static(path.join(__dirname,".","public/")))


app.get('/api/test', (req,res) => {
    res.status(200).json({message:"test in port 3000"})
})

app.listen(3000,console.log("working in port 3000"))