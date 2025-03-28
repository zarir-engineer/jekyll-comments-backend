const express = require("express");
const cors = require("cors");
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 3000;

// connect to mongodb
const mongoose = require('mongoose');
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/test";

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

const commentSchema = new mongoose.Schema({
  name: String,
  comment: String,
  timestamp: { type: Date, default: Date.now }
});

const Comment = mongoose.model("Comment", commentSchema);

const testComment = new Comment({
    name: "Test User",
    comment: "This is a test comment!"
});

testComment.save()
    .then(() => console.log("✅ Test comment added!"))
    .catch(err => console.error("❌ Error inserting test comment:", err));

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Jekyll Comments Backend is running.");
});

app.get("/comments/:slug", async (req, res) => {
    try {
        const comments = await Comment.find({ slug: req.params.slug });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: "Failed to load comments" });
    }
});


app.post("/comments", (req, res) => {
    try {
        app.post("/comments", async (req, res) => {
            const { name, comment, slug } = req.body;
            if (!name || !comment || !slug) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            try {
                const newComment = await Comment.create({ name, comment, slug });
                res.json({ success: true, comment: newComment });
            } catch (err) {
                res.status(500).json({ error: "Failed to save comment" });
            }
        });

        res.json({ success: true, comment: newComment });
    } catch (err) {
        res.status(500).json({ error: "Failed to save comment" });
    }
});

// Start server
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
