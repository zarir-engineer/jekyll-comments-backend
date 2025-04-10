// deleteOldComments.js
require("dotenv").config();
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  name: String,
  comment: String,
  timestamp: { type: Date, default: Date.now },
  slug: String, // the new field
});

const Comment = mongoose.model("Comment", commentSchema);

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const result = await Comment.deleteMany({ slug: { $exists: false } });
    console.log(`🗑️ Deleted ${result.deletedCount} old comments without slug`);

    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();
