const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Use CORS to allow requests from Jekyll frontend
app.use(cors());
app.use(express.json()); // Correct JSON parser

// Path to the comments JSON file
const commentsFile = path.join(__dirname, "comments.json");

// Ensure the file exists
if (!fs.existsSync(commentsFile)) {
    fs.writeFileSync(commentsFile, JSON.stringify({ comments: {} }, null, 2));
}

// Get all comments
app.get("/comments", (req, res) => {
    fs.readFile(commentsFile, "utf8", (err, data) => {
        if (err) return res.status(500).json({ error: "Failed to load comments" });

        res.json(JSON.parse(data));
    });
});

// Add a new comment
app.post("/comments", (req, res) => {
    const { name, email, comment, slug } = req.body;
    if (!name || !email || !comment || !slug) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    fs.readFile(commentsFile, "utf8", (err, data) => {
        if (err) return res.status(500).json({ error: "Failed to read comments" });

        let comments = JSON.parse(data);
        if (!comments[slug]) comments[slug] = [];

        const newComment = {
            name,
            email,
            comment,
            date: new Date().toISOString(),
        };

        comments[slug].push(newComment);

        fs.writeFile(commentsFile, JSON.stringify(comments, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Failed to save comment" });

            res.json({ success: true, comment: newComment });
        });
    });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
