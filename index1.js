// let express = require("express");
// let mongoose = require("mongoose");
// let app = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// const cors = require("cors");
// app.use(cors());
// require("dotenv").config();

// const port = 3000;
// // let MongoURL = "mongodb://127.0.0.1:27017/eLearning";

// let MongoURL = process.env.DB_URL;

// main()
//   .then(console.log("connected to db"))
//   .catch((err) => {
//     console.log(err);
//   });
// async function main() {
//   await mongoose.connect(MongoURL);
// }

// let commentSchema = mongoose.Schema({
//   name: String,
//   image: {
//     type: String,
//     default:
//       "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp",

//     set: (v) =>
//       v === ""
//         ? "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp"
//         : v,
//   },
//   rating: Number,
//   comment: String,
//   date: {
//     type: Date,
//     default: Date.now(),
//   },
// });

// let Feedback = mongoose.model("Feedback", commentSchema);

// app.post("/feedback/new", async (req, res) => {
//   console.log(req.body);
//   let { name, image, rating, comment, date } = req.body;
//   let newFeedback = new Feedback({ name, image, rating, comment, date });
//   await newFeedback.save();
//   res.redirect(`${process.env.FRONTEND_URL}/feedback`);
// });

// app.get("/feedback", async (req, res) => {
//   let data = await Feedback.find({});
//   // console.log(data);
//   res.send(data);
// });

// app.get("/feedback/:id", async (req, res) => {
//   let { id } = req.params;
//   let data = await Feedback.findOneAndDelete({ _id: id });
//   // console.log(data);
//   res.redirect(`${process.env.FRONTEND_URL}/feedback`);
// });

// app.listen(port, () => {
//   console.log(`listening on port ${port}`);
// });

// backend/index.js
// const express = require("express");
// const Stripe = require("stripe");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// require("dotenv").config();
// const { sql, poolPromise } = require("./db");
// const sqlite3 = require("sqlite3").verbose();
// const path = require("path");

// const dbPath = path.resolve(__dirname, "database.db");
// const db = new sqlite3.Database(dbPath, (err) => {
//   if (err) console.error("❌ SQLite connection error:", err);
//   else console.log("✅ Connected to local SQLite database!");
// });

// // Create necessary tables
// db.serialize(() => {
//   db.run(`
//     CREATE TABLE IF NOT EXISTS Users (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT,
//       email TEXT UNIQUE,
//       password TEXT,
//       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//     )
//   `);

//   db.run(`
//     CREATE TABLE IF NOT EXISTS Feedbacks (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT,
//       image TEXT,
//       rating INTEGER,
//       comment TEXT,
//       date DATETIME DEFAULT CURRENT_TIMESTAMP
//     )
//   `);

//   db.run(`
//     CREATE TABLE IF NOT EXISTS Payments (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       courseName TEXT,
//       price REAL,
//       paymentStatus TEXT,
//       date DATETIME DEFAULT CURRENT_TIMESTAMP
//     )
//   `);
// });

// const app = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cors());
// app.use(bodyParser.json());

// const port = process.env.PORT || 3000;

// // Test database connection on startup
// app.get("/test-db", async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const result = await pool.request().query("SELECT DB_NAME() as db_name, @@version as version");
//     res.json({
//       success: true,
//       database: result.recordset[0].db_name,
//       version: result.recordset[0].version
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       error: err.message
//     });
//   }
// });
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// app.post("/create-checkout-session", async (req, res) => {
//   try {
//     const { amount, courseName } = req.body;

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       line_items: [
//         {
//           price_data: {
//             currency: "usd",
//             product_data: { name: courseName },
//             unit_amount: amount, // amount in paise (₹499 = 49900)
//           },
//           quantity: 1,
//         },
//       ],
//       mode: "payment",
//       success_url: "http://localhost:5173/success",
//       cancel_url: "http://localhost:5173/cancel",
//     });

//     res.json({ url: session.url });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });
// app.post("/payment/save", (req, res) => {
//   const { courseName, price } = req.body;
//   db.run(
//     `INSERT INTO Payments (courseName, price, paymentStatus) VALUES (?, ?, ?)`,
//     [courseName, price, "Success"],
//     function (err) {
//       if (err) return res.status(500).json({ error: err.message });
//       res.json({ success: true, id: this.lastID });
//     }
//   );
// });

  
// // Register a new user
// app.post("/register", async (req, res) => {
//   const { name, email, phone, password1, password2 } = req.body;

//   if (password1 !== password2) {
//     return res.status(400).json({ error: "Passwords do not match" });
//   }

//   try {
//     const pool = await poolPromise;

//     // First, check if tables exist
//     const tableCheck = await pool.request()
//       .query(`SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users'`);
    
//     if (tableCheck.recordset.length === 0) {
//       return res.status(500).json({ error: "Users table does not exist" });
//     }

//     await pool.request()
//       .input("name", sql.NVarChar, name)
//       .input("email", sql.NVarChar, email)
//       .input("phone", sql.NVarChar, phone)
//       .input("password_hash", sql.NVarChar, password1)
//       .query(`INSERT INTO Users (name, email, phone, password_hash, created_at)
//               VALUES (@name, @email, @phone, @password_hash, GETDATE())`);

//     res.json({ success: true, message: "User registered successfully" });
//   } catch (err) {
//     console.error("Registration error:", err);
    
//     if (err.number === 2627) { // Primary key violation
//       return res.status(400).json({ error: "User already exists" });
//     }
    
//     res.status(500).json({ error: "Database error: " + err.message });
//   }
// });
// const { expressjwt: jwt } = require("express-jwt");
// const jwksRsa = require("jwks-rsa");

// // Auth0 JWT middleware
// const checkJwt = jwt({
//   secret: jwksRsa.expressJwtSecret({
//     cache: true,
//     rateLimit: true,
//     jwksRequestsPerMinute: 5,
//     jwksUri: `https://YOUR_AUTH0_DOMAIN/.well-known/jwks.json`
//   }),
//   audience: "YOUR_API_IDENTIFIER",
//   issuer: `https://YOUR_AUTH0_DOMAIN/`,
//   algorithms: ["RS256"]
// });

// // Protected route example
// app.get("/profile", checkJwt, async (req, res) => {
//   const userEmail = req.auth.email;

//   // Optional: insert into Azure SQL Users table if new
//   try {
//     const pool = await poolPromise;
//     const existingUser = await pool.request()
//       .input("email", sql.NVarChar, userEmail)
//       .query("SELECT * FROM Users WHERE email = @email");

//     if (existingUser.recordset.length === 0) {
//       await pool.request()
//         .input("email", sql.NVarChar, userEmail)
//         .input("name", sql.NVarChar, req.auth.name || "Unknown")
//         .query("INSERT INTO Users (name, email) VALUES (@name, @email)");
//     }

//     res.send({ message: "User info stored successfully!" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Database error");
//   }
// });

// // // -------------------- FEEDBACK ROUTES -------------------- //

// // // Add new feedback
// // app.post("/feedback/new", async (req, res) => {
// //   const { name, image, rating, comment } = req.body;
  
// //   try {
// //     const pool = await poolPromise;
    
// //     await pool.request()
// //       .input("name", sql.NVarChar, name)
// //       .input("image", sql.NVarChar, image || "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp")
// //       .input("rating", sql.Int, rating)
// //       .input("comment", sql.NVarChar, comment)
// //       .query(`INSERT INTO Feedbacks (name, image, rating, comment, date)
// //               VALUES (@name, @image, @rating, @comment, GETDATE())`);
              
// //     res.json({ success: true, message: "Feedback added successfully" });
// //   } catch (err) {
// //     console.error("Feedback error:", err);
// //     res.status(500).json({ error: "Database error: " + err.message });
// //   }
// // });

// // // Get all feedback
// // app.get("/feedback", async (req, res) => {
// //   try {
// //     const pool = await poolPromise;
// //     const result = await pool.request()
// //       .query("SELECT * FROM Feedbacks ORDER BY date DESC");
      
// //     res.json({ success: true, data: result.recordset });
// //   } catch (err) {
// //     console.error("Get feedback error:", err);
// //     res.status(500).json({ error: "Database error: " + err.message });
// //   }
// // });

// // // Delete feedback by id - Changed from GET to DELETE method
// // app.delete("/feedback/:id", async (req, res) => {
// //   const { id } = req.params;
  
// //   try {
// //     const pool = await poolPromise;
// //     await pool.request()
// //       .input("id", sql.Int, id)
// //       .query("DELETE FROM Feedbacks WHERE feedback_id = @id");
      
// //     res.json({ success: true, message: "Feedback deleted successfully" });
// //   } catch (err) {
// //     console.error("Delete feedback error:", err);
// //     res.status(500).json({ error: "Database error: " + err.message });
// //   }
// // });
// // Add new feedback
// app.post("/feedback/new", (req, res) => {
//   const { name, image, rating, comment } = req.body;
//   db.run(
//     `INSERT INTO Feedbacks (name, image, rating, comment) VALUES (?, ?, ?, ?)`,
//     [name, image || "default.png", rating, comment],
//     function (err) {
//       if (err) return res.status(500).json({ error: err.message });
//       res.json({ success: true, id: this.lastID });
//     }
//   );
// });

// // Get all feedback
// app.get("/feedback", (req, res) => {
//   db.all(`SELECT * FROM Feedbacks ORDER BY date DESC`, [], (err, rows) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json({ success: true, data: rows });
//   });
// });

// // Delete feedback by ID
// app.delete("/feedback/:id", (req, res) => {
//   db.run(`DELETE FROM Feedbacks WHERE id = ?`, [req.params.id], function (err) {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json({ success: true, message: "Feedback deleted!" });
//   });
// });

// // Health check endpoint
// app.get("/health", (req, res) => {
//   res.json({ 
//     status: "OK", 
//     timestamp: new Date().toISOString(),
//     port: port 
//   });
// });

// app.listen(port, () => {
//   console.log(`Backend running on port ${port}`);
//   console.log(`Health check: http://localhost:${port}/health`);
//   console.log(`DB test: http://localhost:${port}/test-db`);
// });
// }