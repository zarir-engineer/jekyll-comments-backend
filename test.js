const mongoose = require("mongoose");

const uri = "mongodb://mongo:tZtQtUdCxGoXbyNulEzgYZfUwAbpsJmn@tramway.proxy.rlwy.net:29723/test?authSource=admin";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });
