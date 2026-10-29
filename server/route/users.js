const express = require("express")
const mongoose = require("mongoose")
const User = require("../models/User")
const Post = require("../models/Post")
const requireAuth = require("../middleware/auth")

const route = express.Router()


route.patch("/me", requireAuth, async (req, res) => {
  try {
    const { bio } = req.body

    if (typeof bio !== "string") {
      return res.status(400).json({ error: "Bio is required" })
    }
    if (bio.length > 160) {
      return res.status(400).json({ error: "Bio must be 160 characters or less" })
    }

    const user = await User.findByIdAndUpdate(req.userid, { bio: bio.trim() }, { new: true })
      .select("-password")
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" })
    }

    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})


route.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" })
    }

    const user = await User.findById(id).select("name bio followers following createdAt")
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const posts = await Post.find({ author: id })
      .sort({ createdAt: -1 })
      .populate("author", "name")

    res.json({ user, posts })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})


route.post("/:id/follow", requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" })
    }
    if (id === req.userid) {
      return res.status(400).json({ error: "You can't follow yourself" })
    }

    const target = await User.findById(id).select("followers")
    if (!target) {
      return res.status(404).json({ error: "User not found" })
    }

    const following = target.followers.some((u) => u.toString() === req.userid)
    const op = following ? "$pull" : "$addToSet"

    await User.updateOne({ _id: req.userid }, { [op]: { following: id } })
    const updated = await User.findByIdAndUpdate(id, { [op]: { followers: req.userid } }, { new: true })

    res.json({ following: !following, followers: updated.followers.length })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})

module.exports = route
