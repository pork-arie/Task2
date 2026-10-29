const express = require("express")
const mongoose = require("mongoose")
const Comment = require("../models/Comment")
const requireAuth = require("../middleware/auth")

const route = express.Router()


route.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid comment ID" })
    }

    const comment = await Comment.findById(id)
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" })
    }

    if (comment.author.toString() !== req.userid) {
      return res.status(403).json({ error: "You can only delete your own comments" })
    }

    await comment.deleteOne()
    res.json({ message: "Comment deleted" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})

module.exports = route
