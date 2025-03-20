const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const yaml = require("js-yaml"); // YAML support

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Allow JSON parsing

// Path to Jekyll's `_data/comments/` folder
const commentsDir = path.join(__dirname, "buildyourhome/_data/comments");

// Ensure `_data/comments/` directory exists
if (!fs.existsSync(commentsDir)) {
    fs.mkdirSync(commentsDir, { recursive: true });
}

app.get("/", (req, res) => {
    res.send("Jekyll Comments Backend is running.");
});



app.get('/comments/:slug', async (req, res) => {
    const slug = req.params.slug;
    const filePath = `_data/comments/${slug}.yml`;

    console.log(`Checking for file: ${filePath}`); // Add this line

    if (!fs.existsSync(filePath)) {
        console.log("File not found!");  // Log missing file
        return res.json([]); // Return empty array if file doesn't exist
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log("File content:", fileContent); // Log file contents

    const comments = yaml.load(fileContent) || [];
    res.json(comments);
});

// Get comments for a specific post (slug)
//app.get("/comments/:slug", (req, res) => {
//    const slug = req.params.slug;
//    const filePath = path.join(commentsDir, `${slug}.yml`);
//
//    console.log(`Checking for file: ${filePath}`); // Add this line
//
//    if (!fs.existsSync(filePath)) {
//        return res.json([]); // Return empty if no comments
//    }
//
//    try {
//        const fileContents = fs.readFileSync(filePath, "utf8");
//        const comments = yaml.load(fileContents) || [];
//        res.json(comments);
//    } catch (err) {
//        res.status(500).json({ error: "Failed to read comments" });
//    }
//});

// Save a new comment to a YAML file
//app.post("/comments", (req, res) => {
//    const { name, email, comment, slug } = req.body;
//    if (!name || !email || !comment || !slug) {
//        return res.status(400).json({ error: "Missing required fields" });
//    }
//
//    const filePath = path.join(commentsDir, `${slug}.yml`);
//
//    // Read existing comments (if any)
//    let comments = [];
//    if (fs.existsSync(filePath)) {
//        try {
//            const fileContents = fs.readFileSync(filePath, "utf8");
//            comments = yaml.load(fileContents) || [];
//        } catch (err) {
//            return res.status(500).json({ error: "Failed to load comments" });
//        }
//    }
//
//    // Create new comment entry
//    const newComment = {
//        name,
//        email,
//        comment,
//        date: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
//    };
//
//    comments.push(newComment);
//
//    // Save back to YAML
//    try {
//        fs.writeFileSync(filePath, yaml.dump(comments), "utf8");
//        res.json({ success: true, comment: newComment });
//    } catch (err) {
//        res.status(500).json({ error: "Failed to save comment" });
//    }
//});

app.post("/comments", (req, res) => {
    const { name, email, comment, slug } = req.body;

    // Validate required fields
    if (!name || !email || !comment || !slug) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const filePath = path.join(commentsDir, `${slug}.yml`);

    let comments = [];

    // Read existing comments if file exists
    if (fs.existsSync(filePath)) {
        try {
            const fileContents = fs.readFileSync(filePath, "utf8");
            comments = yaml.load(fileContents) || [];
        } catch (err) {
            console.error("Error reading YAML file:", err);
            return res.status(500).json({ error: "Failed to load comments" });
        }
    }

    // Create new comment entry
    const newComment = {
        name,
        email,
        comment,
        date: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
    };

    comments.push(newComment);

    // Save back to YAML
    try {
        fs.writeFileSync(filePath, yaml.dump(comments), "utf8");
        console.log(`New comment saved to ${filePath}`);
        res.json({ success: true, comment: newComment });
    } catch (err) {
        console.error("Error writing YAML file:", err);
        res.status(500).json({ error: "Failed to save comment" });
    }
});
// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
