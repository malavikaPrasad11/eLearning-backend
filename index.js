
// // backend/index.js
// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");
// require("dotenv").config();

// // Auth0
// const { expressjwt: jwt } = require("express-jwt");
// const jwksRsa = require("jwks-rsa");

// const app = express();
// const port = process.env.PORT || 3000;

// // -------------------- Middleware -------------------- //
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // -------------------- MongoDB Connection -------------------- //
// const mongoURL = process.env.DB_URL; // set this in your .env file

// mongoose
//   .connect(mongoURL)
//   .then(() => console.log("✅ Connected to MongoDB!"))
//   .catch((err) => console.error("❌ MongoDB connection error:", err));

// // -------------------- Mongoose Schemas -------------------- //

// const userSchema = new mongoose.Schema({
//   name: String,
//   email: { type: String, unique: true },
//   createdAt: { type: Date, default: Date.now },
// });

// const feedbackSchema = new mongoose.Schema({
//   name: String,
//   image: {
//     type: String,
//     default: "https://yourdomain.com/default-avatar.png",
//     set: (v) =>
//       v === ""
//         ? "https://yourdomain.com/default-avatar.png"
//         : v,
//   },
//   rating: Number,
//   comment: String,
//   date: { type: Date, default: Date.now },
// });

// const User = mongoose.model("User", userSchema);
// const Feedback = mongoose.model("Feedback", feedbackSchema);

// // -------------------- Auth0 JWT Middleware -------------------- //

// const checkJwt = jwt({
//   secret: jwksRsa.expressJwtSecret({
//     cache: true,
//     rateLimit: true,
//     jwksRequestsPerMinute: 5,
//     jwksUri: "https://dev-u7vek4cis1rwe2yw.us.auth0.com/.well-known/jwks.json",
//   }),
//   audience: "https://my-elearning-api", // your API identifier
//   issuer: "https://dev-u7vek4cis1rwe2yw.us.auth0.com/",
//   algorithms: ["RS256"],
// });

// // -------------------- Routes -------------------- //

// // Health check
// app.get("/health", (req, res) => {
//   res.json({ status: "OK", timestamp: new Date().toISOString(), port });
// });

// // -------------------- Users -------------------- //
// // Protected route: create/update user in DB
// app.post("/profile", checkJwt, async (req, res) => {
//   const { name, email } = req.body;

//   try {
//     let user = await User.findOne({ email });
//     if (!user) {
//       user = new User({ name, email });
//       await user.save();
//       return res.json({ message: "User saved successfully!" });
//     } else {
//       return res.json({ message: "User already exists." });
//     }
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// });

// // -------------------- Feedback -------------------- //

// // Add new feedback
// app.post("/feedback/new", async (req, res) => {
//   const { name, image, rating, comment } = req.body;
//   try {
//     const newFeedback = new Feedback({ name, image, rating, comment });
//     await newFeedback.save();
//     res.json({ success: true, id: newFeedback._id });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Get all feedback
// app.get("/feedback", async (req, res) => {
//   try {
//     const data = await Feedback.find({}).sort({ date: -1 });
//     res.json({ success: true, data });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Delete feedback by ID
// app.delete("/feedback/:id", async (req, res) => {
//   try {
//     await Feedback.findByIdAndDelete(req.params.id);
//     res.json({ success: true, message: "Feedback deleted!" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // -------------------- Start Server -------------------- //
// app.listen(port, () => {
//   console.log(`Backend running on port ${port}`);
// });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Auth0
const { expressjwt: expressjwtMiddleware } = require("express-jwt");
const jwksRsa = require("jwks-rsa");

// JWT for custom auth
const jsonwebtoken = require("jsonwebtoken");

// Stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3000;

// -------------------- Middleware -------------------- //
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- MongoDB Connection -------------------- //
const mongoURL = process.env.DB_URL;

mongoose
  .connect(mongoURL)
  .then(() => console.log("✅ Connected to MongoDB!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// -------------------- Mongoose Schemas -------------------- //

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // Added for custom auth
  createdAt: { type: Date, default: Date.now },
});

const feedbackSchema = new mongoose.Schema({
  name: String,
  image: {
    type: String,
    default: "https://yourdomain.com/default-avatar.png",
    set: (v) =>
      v === "" ? "https://yourdomain.com/default-avatar.png" : v,
  },
  rating: Number,
  comment: String,
  date: { type: Date, default: Date.now },
});

const paymentSchema = new mongoose.Schema({
  courseName: String,
  amount: Number,
  sessionId: String,
  status: { type: String, default: "pending" },
  userEmail: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Feedback = mongoose.model("Feedback", feedbackSchema);
const Payment = mongoose.model("Payment", paymentSchema);

// -------------------- Auth0 JWT Middleware -------------------- //

const checkJwt = expressjwtMiddleware({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://dev-u7vek4cis1rwe2yw.us.auth0.com/.well-known/jwks.json",
  }),
  audience: "https://my-elearning-api",
  issuer: "https://dev-u7vek4cis1rwe2yw.us.auth0.com/",
  algorithms: ["RS256"],
});

// -------------------- Routes -------------------- //

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), port });
});

// -------------------- Authentication -------------------- //

// Register new user
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Login user
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user has a password (for Auth0 users who don't have passwords)
    if (!user.password) {
      return res.status(401).json({ error: "Please login with Auth0" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jsonwebtoken.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- Users -------------------- //

// Protected route: create/update user in DB (Auth0)
app.post("/profile", checkJwt, async (req, res) => {
  const { name, email } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email });
      await user.save();
      return res.json({ message: "User saved successfully!" });
    } else {
      return res.json({ message: "User already exists." });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------- Feedback -------------------- //

// Add new feedback
app.post("/feedback/new", async (req, res) => {
  const { name, image, rating, comment } = req.body;
  try {
    const newFeedback = new Feedback({ name, image, rating, comment });
    await newFeedback.save();
    res.json({ success: true, id: newFeedback._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all feedback
app.get("/feedback", async (req, res) => {
  try {
    const data = await Feedback.find({}).sort({ date: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete feedback by ID
app.delete("/feedback/:id", async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Feedback deleted!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- Stripe Payment -------------------- //

// Create Stripe checkout session
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { amount, courseName, userEmail } = req.body;

    // Validate input
    if (!amount || !courseName) {
      return res.status(400).json({
        error: "Missing required fields: amount and courseName",
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: courseName,
              description: `Enroll in ${courseName}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${
        process.env.FRONTEND_URL || "https://elearning-frontend-8iwv.onrender.com"
      }/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.FRONTEND_URL || "https://elearning-frontend-8iwv.onrender.com"
      }/cancel`,
      metadata: {
        courseName,
        userEmail: userEmail || "guest",
      },
    });

    // Save payment record to database
    const payment = new Payment({
      courseName,
      amount: amount / 100,
      sessionId: session.id,
      userEmail: userEmail || "guest",
      status: "pending",
    });
    await payment.save();

    console.log("✅ Checkout session created:", session.id);
    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("❌ Stripe Error:", error);
    res.status(500).json({
      error: error.message || "Failed to create checkout session",
    });
  }
});

// Verify payment
app.get("/verify-payment/:sessionId", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId
    );

    // Update payment status in database
    await Payment.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      { status: session.payment_status === "paid" ? "completed" : "failed" }
    );

    res.json({
      success: true,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
    });
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Save payment details (called from success page)
app.post("/payment/save", async (req, res) => {
  try {
    const { courseName, price, sessionId } = req.body;

    const payment = new Payment({
      courseName,
      amount: price,
      sessionId: sessionId || "unknown",
      status: "completed",
    });

    await payment.save();
    res.json({ success: true, message: "Payment saved successfully" });
  } catch (error) {
    console.error("Error saving payment:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all payments (admin)
app.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- Start Server -------------------- //
app.listen(port, () => {
  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📍 http://localhost:${port}`);
});
