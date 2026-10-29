const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const requireAuth = require("../middleware/auth")

const route = express.Router()

const cookieOptions = { httpOnly: true, sameSite: "strict" }

route.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(400).json({ error: "Email already exists" })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashed })

    res.status(201).json({ id: user._id, name: user.name, email: user.email })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})

route.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
    res.cookie("token", token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })

    res.json({ id: user._id, name: user.name, email: user.email })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})

route.post("/logout", (req, res) => {
  res.clearCookie("token", cookieOptions)
  res.json({ message: "Logged out" })
})

route.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userid).select("-password")
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" })
    }
    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})

module.exports = route