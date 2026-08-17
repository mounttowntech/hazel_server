require("dotenv").config();

const app = require("./app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5004;

// Connect MongoDB
connectDB();

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});