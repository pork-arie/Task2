const express = require("express")
const mongoose = require("mongoose")
const Post = require("../models/Post")
const Comment = require("../models/Comment")
const User = require("../models/User")
const requireAuth = require("../middleware/auth")

const route = express.Router()

const PAGE_SIZE = 10
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id)


const authIfFollowing = (req, res, next) =>
  req.query.feed === "following" ? requireAuth(req, res, next) : next()


route.post("/", requireAuth, async (req, res) => {
  try {
    const { content } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Post can't be empty" })
    }
    if (content.length > 500) {
      return res.status(400).json({ error: "Post must be 500 characters or less" })
    }

    const post = await Post.create({ author: req.userid, content })
    await post.populate("author", "name")

    res.status(201).json(post)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})


route.get("/", authIfFollowing, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const filter = {}

    if (req.query.feed === "following") {
      const me = await User.findById(req.userid).select("following")
      if (!me) {
        return res.status(401).json({ error: "User no longer exists" })
      }
      filter.author = { $in: me.following }
    }


    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE + 1)
      .populate("author", "name")

    res.json({
      posts: posts.slice(0, PAGE_SIZE),
      page,
      hasMore: posts.length > PAGE_SIZE
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})

// Delete a post (author only)
route.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid post ID" })
    }

    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    if (post.author.toString() !== req.userid) {
      return res.status(403).json({ error: "You can only delete your own posts" })
    }

    await Comment.deleteMany({ post: post._id })
    await post.deleteOne()
    res.json({ message: "Post deleted" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})

// Like / unlike a post (toggle)
route.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid post ID" })
    }

    const post = await Post.findById(id).select("likes")
    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    const liked = post.likes.some((u) => u.toString() === req.userid)
    const update = liked ? { $pull: { likes: req.userid } } : { $addToSet: { likes: req.userid } }
    const updated = await Post.findByIdAndUpdate(id, update, { new: true })

    res.json({ liked: !liked, likes: updated.likes.length })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})

// Get a post's comments (public)
route.get("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid post ID" })
    }

    const comments = await Comment.find({ post: id })
      .sort({ createdAt: 1 })
      .populate("author", "name")

    res.json(comments)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})

// Add a comment (logged in)
route.post("/:id/comments", requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body

    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid post ID" })
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment can't be empty" })
    }
    if (content.length > 300) {
      return res.status(400).json({ error: "Comment must be 300 characters or less" })
    }

    const post = await Post.exists({ _id: id })
    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    const comment = await Comment.create({ post: id, author: req.userid, content })
    await comment.populate("author", "name")

    res.status(201).json(comment)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})

module.exports = route
