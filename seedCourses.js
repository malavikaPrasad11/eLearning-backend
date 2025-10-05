require("dotenv").config();
const mongoose = require("mongoose");

// MongoDB connection
const MongoURL = process.env.DB_URL;
mongoose
  .connect(MongoURL)
  .then(() => console.log("Connected to MongoDB for seeding courses"))
  .catch((err) => console.log(err));

// Course schema
const courseSchema = new mongoose.Schema({
  title: String,
  category: String,
  description: String,
  instructor: String,
  duration: String,
  image: String,
});

const Course = mongoose.model("Course", courseSchema);

// Sample course data
const courses = [
  {
    title: "Java Programming",
    category: "Programming",
    description: "Learn core Java concepts from scratch.",
    instructor: "Malavika S Prasad",
    duration: "40 hours",
    image: "https://via.placeholder.com/150",
  },
  {
    title: "MERN Stack Development",
    category: "Web Development",
    description: "Fullstack development with MongoDB, Express, React, Node.",
    instructor: "Vibhu Sanchana",
    duration: "60 hours",
    image: "https://via.placeholder.com/150",
  },
  {
    title: "DSA & Algorithms",
    category: "Programming",
    description: "Data Structures and Algorithms for interviews.",
    instructor: "Geshna CB",
    duration: "50 hours",
    image: "https://via.placeholder.com/150",
  },
  {
    title: "Fullstack Web Development",
    category: "Web Development",
    description: "Frontend + Backend web development.",
    instructor: "Asmi K",
    duration: "70 hours",
    image: "https://via.placeholder.com/150",
  },
];

async function seed() {
  try {
    await Course.deleteMany(); // Remove existing data
    await Course.insertMany(courses); // Insert sample courses
    console.log("Courses seeded successfully!");
    mongoose.connection.close();
  } catch (err) {
    console.log(err);
  }
}

seed();
