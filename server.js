const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const yaml = require("js-yaml");
const { execSync } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
const GIT_USER_NAME = process.env.GIT_USER_NAME;
const GIT_USER_EMAIL = process.env.GIT_USER_EMAIL;
const REPO_URL = process.env.REPO_URL;
const BRANCH = process.env.BRANCH || "gh-pages";

if (!GITHUB_ACCESS_TOKEN || !GIT_USER_NAME || !GIT_USER_EMAIL || !REPO_URL) {
    console.error("❌ Missing required environment variables!");
    process.exit(1);
}

const repoDir = "/app/repo"; // Clone repo into this directory
const commentsDir = path.join(repoDir, "_data/comments");

// Clone repo on startup (if not already cloned)
try {
    if (!fs.existsSync(repoDir)) {
        execSync(`git clone --depth=1 -b ${BRANCH} https://${GITHUB_ACCESS_TOKEN}@github.com/${REPO_URL.replace("https://github.com/", "")} ${repoDir}`, { stdio: "inherit" });
        console.log("✅ Repository cloned successfully.");
    }
} catch (error) {
    console.error("❌ Error cloning repository:", error.message);
}

// Ensure `_data/comments/` directory exists
if (!fs.existsSync(commentsDir)) {
    fs.mkdirSync(commentsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Clone the repo on startup
try {
    execSync(`git clone --depth=1 -b ${BRANCH} https://${GITHUB_ACCESS_TOKEN}@github.com/${REPO_URL.replace("https://github.com/", "")} ${repoDir}`, { stdio: "inherit" });
    console.log("✅ Repository cloned successfully.");
} catch (error) {
    console.error("❌ Error cloning repository:", error.message);
}

app.get("/", (req, res) => {
    res.send("Jekyll Comments Backend is running.");
});

app.get("/comments/:slug", async (req, res) => {
    const slug = req.params.slug;
    const filePath = path.join(commentsDir, `${slug}.yml`);

    if (!fs.existsSync(filePath)) {
        return res.json([]);
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
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
    console.log("+++ running till here")
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
                git config user.name "${GIT_USER_NAME}" &&
                git config user.email "${GIT_USER_EMAIL}" &&
                git add . &&
                git commit -m "New comment update" &&
                git push https://${GITHUB_ACCESS_TOKEN}@github.com/${REPO_URL.replace("https://github.com/", "")} ${BRANCH}
            `, { stdio: "inherit" });

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
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
