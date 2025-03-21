const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const yaml = require("js-yaml"); // YAML support
const { execSync } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Allow JSON parsing

console.log("Current working directory:", __dirname);
console.log("Full path to comments folder:", path.join(__dirname, "_data/comments"));

// Path to Jekyll's `_data/comments/` folder
const commentsDir = path.join(__dirname, "buildyourhome/_data/comments");
const repoDir = "/app/buildyourhome/_data/comments"; // Adjust the path if needed

console.log(" repoDir :", repoDir);
console.log(" commentsDir :", commentsDir);

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

app.post("/comments", (req, res) => {
    const { name, email, comment, slug } = req.body;
    if (!name || !email || !comment || !slug) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const filePath = path.join(commentsDir, `${slug}.yml`);

    let comments = [];
    if (fs.existsSync(filePath)) {
        try {
            const fileContents = fs.readFileSync(filePath, "utf8");
            comments = yaml.load(fileContents) || [];
        } catch (err) {
            return res.status(500).json({ error: "Failed to load comments" });
        }
    }

    // Create new comment entry
    const newComment = {
        name,
        email,
        comment,
        date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    };

    comments.push(newComment);

    // Save back to YAML
    try {
        fs.writeFileSync(filePath, yaml.dump(comments), "utf8");

        // 🚀 Commit & push the new comment to GitHub

        try {
            execSync(`
                cd ${repoDir} &&
                git config user.name "Railway Bot" &&
                git config user.email "railway@users.noreply.github.com" &&
                git add . &&
                git commit -m "New comment update" &&
                git push https://$GITHUB_ACCESS_TOKEN@github.com/zarir-engineer/buildyourhome.git gh-pages
            `, { stdio: "inherit", env: { ...process.env, GITHUB_ACCESS_TOKEN: process.env.GITHUB_ACCESS_TOKEN } });

            console.log("✅ Successfully pushed changes to GitHub.");
        } catch (error) {
            console.error("❌ Git push failed:", error.message);
        }

        res.json({ success: true, comment: newComment });
    } catch (err) {
        res.status(500).json({ error: "Failed to save comment" });
    }
});


// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
