const jwt = require('jsonwebtoken')

function requireAuth(req,res,next){
    const token = req.cookies.token
    if(!token){
        return res.status(401).json({error:"You must be logged in"})
    }

    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        req.userid = decoded.id
        next()
    } catch (error) {
        res.clearCookie("token")
        res.status(401).json({error:"Session expired, please log in again"})
    }

}

module.exports = requireAuth
