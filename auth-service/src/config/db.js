const { default: mongoose } = require("mongoose");
const uri = process.env.MONGO_URI || "mongodb://localhost:27017/test";

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.log("DB connection failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
