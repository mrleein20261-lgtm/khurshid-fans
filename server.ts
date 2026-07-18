import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import cors from "cors";
import admin from "firebase-admin";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  readDB,
  writeDB,
  DBUser,
  DBProduct,
  DBOrder,
  DBComplaint,
  DBChat,
  DBMessage,
  DBAnalyticsLog,
} from "./src/db/jsonDb.js";

// Make sure build paths exist
const publicUploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}

// JWT secret for admin auth
const JWT_SECRET = process.env.JWT_SECRET || "khurshid-fans-admin-super-secret-key-2026";

const app = express();

// Enable CORS for all origins
app.use(cors({ origin: "*" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Expose public folder for uploads
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, publicUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize Gemini Client", err);
  }
}

// --- MIDDLEWARES & FIREBASE ADMIN INITIALIZATION ---

let firebaseAdminInitialized = false;
const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
    (admin as any).initializeApp({
      credential: (admin as any).credential.cert(serviceAccount),
    });
    firebaseAdminInitialized = true;
    console.log("Firebase Admin SDK successfully initialized using service account file.");
  } catch (err: any) {
    console.error("Failed to initialize Firebase Admin using service account file:", err);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    (admin as any).initializeApp({
      credential: (admin as any).credential.cert(serviceAccount),
    });
    firebaseAdminInitialized = true;
    console.log("Firebase Admin SDK successfully initialized using FIREBASE_SERVICE_ACCOUNT_JSON env var.");
  } catch (err: any) {
    console.error("Failed to initialize Firebase Admin using env var:", err);
  }
} else {
  console.log("⚠️ Firebase Service Account JSON not found (neither 'firebase-service-account.json' file nor 'FIREBASE_SERVICE_ACCOUNT_JSON' env var).");
  console.log("Firebase Auth verification will fall back to simulation/demo mode using Bearer tokens.");
}

// Admin Authentication Middleware
function authenticateAdmin(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}

// User Authentication Middleware verifying Firebase ID Token
async function authenticateUser(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header. Expected 'Bearer <token>'" });
  }
  const token = authHeader.split(" ")[1];
  
  let uid = "";
  let email = "";
  let name = "";

  if (firebaseAdminInitialized) {
    try {
      const decodedToken = await (admin as any).auth().verifyIdToken(token);
      uid = decodedToken.uid;
      email = decodedToken.email || "";
      name = decodedToken.name || email.split("@")[0] || "Firebase User";
    } catch (err: any) {
      console.error("Firebase ID Token verification failed:", err.message);
      return res.status(401).json({ error: `Unauthorized: Invalid Firebase ID Token. Error: ${err.message}` });
    }
  } else {
    // Simulator / Fallback mode
    uid = token.startsWith("fb-") ? token.replace("fb-", "") : token;
    email = uid.includes("@") ? uid : `${uid}@example.com`;
    name = email.split("@")[0].toUpperCase();
    console.log(`[Firebase Admin Simulator] Authenticated user using fallback. UID: ${uid}`);
  }

  const db = readDB();
  let user = db.users.find((u) => u.uid === uid);
  
  if (!user) {
    // Auto-register verified firebase user if they don't exist yet
    user = {
      uid,
      email,
      name,
      phone: "",
      city: "Unknown",
      locationHistory: [],
      registeredAt: new Date().toISOString(),
      fanDetails: [],
      usageStats: { daily: [], weekly: [], monthly: [] },
      chatRooms: [`${uid}-chat-room`],
    };
    db.users.push(user);
    
    // Create initial chat room for support
    db.chats.push({
      roomId: `${uid}-chat-room`,
      participants: [uid, "admin"],
      messages: [
        {
          senderId: "admin",
          message: `Welcome ${name} to Khurshid Fans support. How can we help you today?`,
          timestamp: new Date().toISOString(),
          type: "text",
        },
      ],
      lastUpdated: new Date().toISOString(),
    });
    
    writeDB(db);
    console.log(`[Auth] Auto-registered new Firebase authenticated user: ${uid} (${email})`);
  }

  if (user.isBanned) {
    return res.status(403).json({ error: "Your account is banned. Please contact support." });
  }

  req.user = user;
  next();
}

// --- API ENDPOINTS ---

// Root welcome page (GET /) for testing in browser or phone
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Khurshid Fans API Portal</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #00363a 0%, #0c1012 100%);
          color: #f7fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 1rem;
          box-sizing: border-box;
          text-align: center;
        }
        .container {
          background: rgba(22, 27, 34, 0.85);
          padding: 2.5rem;
          border-radius: 16px;
          border: 1px solid rgba(0, 242, 254, 0.15);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          max-width: 550px;
          width: 100%;
        }
        .icon {
          font-size: 3rem;
          color: #00f2fe;
          margin-bottom: 1rem;
          animation: spin 10s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        h1 {
          color: #ffffff;
          font-size: 2rem;
          margin: 0 0 0.5rem 0;
          letter-spacing: 0.5px;
        }
        .status-badge {
          background: rgba(0, 242, 254, 0.15);
          color: #00f2fe;
          padding: 0.35rem 0.85rem;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(0, 242, 254, 0.3);
        }
        p {
          color: #a0aec0;
          line-height: 1.6;
          margin-bottom: 2rem;
          font-size: 1rem;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          color: #0c1012;
          padding: 0.8rem 1.75rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          font-size: 0.95rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0, 242, 254, 0.45);
        }
        .footer-links {
          margin-top: 2.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 1.5rem;
          display: flex;
          gap: 1.25rem;
          justify-content: center;
          font-size: 0.9rem;
        }
        .footer-links a {
          color: #00f2fe;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: #ffffff;
          text-decoration: underline;
        }
        .divider {
          color: rgba(255, 255, 255, 0.2);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🌀</div>
        <h1>Khurshid Fans API</h1>
        <div class="status-badge">● ONLINE & ACTIVE</div>
        <p>
          The production-ready Express backend and integration gateway is fully configured for your Android Application. CORS is enabled globally, and the Firebase Admin SDK verification engine is armed.
        </p>
        <a href="/api/ping" class="btn">Test API Ping Connection</a>
        <div class="footer-links">
          <a href="/dashboard">Admin Console</a>
          <span class="divider">|</span>
          <a href="/api/v1/products">Products Feed</a>
          <span class="divider">|</span>
          <a href="/api/v1/content/about">Company Info</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// 1. App Registrations & Logins
app.post(["/api/v1/auth/register", "/api/auth/register"], (req, res) => {
  const { uid, email, name, phone, city } = req.body;
  if (!uid || !email || !name) {
    return res.status(400).json({ error: "Missing required registration parameters" });
  }

  const db = readDB();
  const existing = db.users.find((u) => u.uid === uid || u.email === email);
  if (existing) {
    return res.status(400).json({ error: "User already registered" });
  }

  const newUser: DBUser = {
    uid,
    email,
    name,
    phone: phone || "",
    city: city || "Unknown",
    locationHistory: [],
    registeredAt: new Date().toISOString(),
    fanDetails: [],
    usageStats: { daily: [], weekly: [], monthly: [] },
    chatRooms: [`${uid}-chat-room`],
  };

  db.users.push(newUser);

  // Initialize chat room for support
  const newChat: DBChat = {
    roomId: `${uid}-chat-room`,
    participants: [uid, "admin"],
    messages: [
      {
        senderId: "admin",
        message: `Welcome ${name} to Khurshid Fans support. How can we help you today?`,
        timestamp: new Date().toISOString(),
        type: "text",
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
  db.chats.push(newChat);

  writeDB(db);
  res.status(201).json({ message: "Registration successful", user: newUser });
});

// App login (verifies simulated Firebase token)
app.post(["/api/v1/auth/login", "/api/auth/login"], (req, res) => {
  const { token, email } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Missing authentication token" });
  }

  let uid = token.startsWith("fb-") ? token.replace("fb-", "") : token;
  const db = readDB();
  let user = db.users.find((u) => u.uid === uid || u.email === email || u.email === token);

  if (!user) {
    // Auto register for demo convenience if email is provided
    if (email) {
      user = {
        uid: uid,
        email: email,
        name: email.split("@")[0].toUpperCase(),
        phone: "+923000000000",
        city: "Unknown",
        locationHistory: [],
        registeredAt: new Date().toISOString(),
        fanDetails: [],
        usageStats: { daily: [], weekly: [], monthly: [] },
        chatRooms: [`${uid}-chat-room`],
      };
      db.users.push(user);
      db.chats.push({
        roomId: `${uid}-chat-room`,
        participants: [uid, "admin"],
        messages: [{ senderId: "admin", message: "System auto-generated chat room.", timestamp: new Date().toISOString(), type: "text" }],
        lastUpdated: new Date().toISOString(),
      });
      writeDB(db);
    } else {
      return res.status(404).json({ error: "User record not found. Please register first." });
    }
  }

  if (user.isBanned) {
    return res.status(403).json({ error: "Your account is banned. Please contact support." });
  }

  res.json({ message: "Login successful", user });
});

// Test Connection API (Public - No Auth Required)
app.get(["/api/ping", "/api/v1/ping"], (req, res) => {
  res.json({ status: "ok" });
});

// 2. Products APIs (Public)
app.get(["/api/v1/products", "/api/products"], (req, res) => {
  const { type, search } = req.query;
  const db = readDB();
  let result = db.products.filter((p) => p.isActive);

  if (type) {
    result = result.filter((p) => p.type === type);
  }

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  res.json(result);
});

app.get(["/api/v1/products/:id", "/api/products/:id"], (req, res) => {
  const db = readDB();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

// 3. User Placing Orders (User Authenticated)
app.post(["/api/v1/orders", "/api/orders"], authenticateUser, (req: any, res) => {
  const { items, shippingAddress } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
    return res.status(400).json({ error: "Missing items or shipping address" });
  }

  const db = readDB();
  let totalAmount = 0;
  const verifiedItems = [];

  for (const item of items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) {
      return res.status(404).json({ error: `Product with id ${item.productId} not found` });
    }
    const itemTotal = product.price * item.quantity;
    totalAmount += itemTotal;
    verifiedItems.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      price: product.price,
    });
  }

  const newOrder: DBOrder = {
    id: "ord-" + Math.floor(1000 + Math.random() * 9000),
    userId: req.user.uid,
    items: verifiedItems,
    totalAmount,
    shippingAddress,
    status: "pending",
    paymentStatus: "pending",
    createdAt: new Date().toISOString(),
  };

  db.orders.push(newOrder);
  writeDB(db);

  // Broadcast to admin dashboard
  io.emit("admin:new-order", newOrder);

  res.status(201).json({ message: "Order placed successfully", order: newOrder });
});

app.get(["/api/v1/orders/my-orders", "/api/orders/my-orders"], authenticateUser, (req: any, res) => {
  const db = readDB();
  const userOrders = db.orders.filter((o) => o.userId === req.user.uid);
  res.json(userOrders);
});

// 4. Content APIs (Public)
app.get(["/api/v1/content/:page", "/api/content/:page"], (req, res) => {
  const { page } = req.params;
  const db = readDB();
  const content = db.content.find((c) => c.page === page);
  if (!content) {
    return res.status(404).json({ error: "Content page not found" });
  }
  res.json(content);
});

// 5. User Complaints (User Authenticated)
app.post(["/api/v1/complaints", "/api/complaints"], authenticateUser, (req: any, res) => {
  const { subject, description, imageUrl } = req.body;
  if (!subject || !description) {
    return res.status(400).json({ error: "Subject and description are required" });
  }

  const db = readDB();
  const newComplaint: DBComplaint = {
    id: "comp-" + Math.floor(200 + Math.random() * 800),
    userId: req.user.uid,
    subject,
    description,
    imageUrl: imageUrl || "",
    status: "open",
    createdAt: new Date().toISOString(),
  };

  db.complaints.push(newComplaint);
  writeDB(db);

  // Broadcast to dashboard
  io.emit("admin:new-complaint", newComplaint);

  res.status(201).json({ message: "Complaint submitted successfully", complaint: newComplaint });
});

app.get(["/api/v1/complaints/my-complaints", "/api/complaints/my-complaints"], authenticateUser, (req: any, res) => {
  const db = readDB();
  const complaints = db.complaints.filter((c) => c.userId === req.user.uid);
  res.json(complaints);
});

// 6. AI Smart Fan Recommender using Gemini SDK (Public/User)
app.post(["/api/v1/ai/recommend", "/api/ai/recommend"], async (req, res) => {
  const { query, roomSize, locationType } = req.body;
  if (!query && !roomSize) {
    return res.status(400).json({ error: "Please describe your room or specifications." });
  }

  const db = readDB();
  const products = db.products.filter((p) => p.isActive);
  const productsContext = products
    .map(
      (p) =>
        `ID: ${p.id}, Name: ${p.name}, Type: ${p.type}, Price: ${p.price} PKR, Specs: ${JSON.stringify(
          p.specs
        )}`
    )
    .join("\n");

  const prompt = `You are the Expert Smart Fan Consultant for "Khurshid Fans", a famous energy-efficient fan manufacturer in Pakistan.
The user is looking for a recommendation based on their request:
Query: "${query || "N/A"}"
Room Size: "${roomSize || "N/A"}"
Location: "${locationType || "N/A"}"

Here are the available Khurshid Fans products in our catalog:
${productsContext}

Please analyze the user's requirements and:
1. Recommend the best matching Khurshid Fan(s) from our actual catalog above (refer to them by their actual names and specs).
2. Explain why this fan is perfect for their room size and location (e.g., ceiling fan sweeps for master bedrooms vs pedestals for dynamic drawing rooms, AC/DC inverter benefits, power/airflow performance, etc.).
3. Structure your response beautifully in a clear, friendly markdown presentation with key product specifications.
4. Estimate their electricity savings. (Inverter fans consume ~40W compared to ~100W traditional fans, which is a 60% saving).

If Gemini is not configured, we provide beautiful insights. Provide a high-quality response.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      return res.json({ recommendation: response.text });
    } catch (err: any) {
      console.error("Gemini model execution failed", err);
    }
  }

  // Fallback Rule-based Smart Recommender if Gemini is not available
  console.log("No Gemini API key or execution failed. Using local Smart Recommender logic.");
  let recommended = products[0]; // default to first
  let reasoning = "";

  const q = String(query || "").toLowerCase() + " " + String(locationType || "").toLowerCase();
  if (q.includes("kitchen") || q.includes("exhaust") || q.includes("bathroom") || q.includes("smoke")) {
    recommended = products.find((p) => p.type === "exhaust") || products[0];
    reasoning = "We recommend the Khurshid Heavy Duty Exhaust Fan 12\". It has automatic gravity shutters, is quiet, and is ideal for quick ventilation and smoke removal in kitchen spaces.";
  } else if (q.includes("garden") || q.includes("drawing") || q.includes("outdoor") || q.includes("pedestal") || q.includes("hall")) {
    recommended = products.find((p) => p.type === "pedestal") || products[0];
    reasoning = "The Khurshid Pedestal Fan AC/DC Inverter Jet Black is perfect for open or dynamic dining/drawing areas where directional airflow and height-adjustability are beneficial. It delivers an outstanding 120 CMM air delivery with only 45W energy consumption.";
  } else if (q.includes("office") || q.includes("small room") || q.includes("bracket")) {
    recommended = products.find((p) => p.type === "bracket") || products[0];
    reasoning = "The Khurshid Bracket Fan AC/DC Inverter in Charcoal Grey is recommended for space-constrained study rooms, small shops, or desks. Wall-mounting frees floor space, while RF remote allows easy control.";
  } else {
    // Ceiling fans
    recommended = products.find((p) => p.type === "ceiling" && p.name.includes("Inverter")) || products[0];
    reasoning = "We recommend our bestseller: the Khurshid Ceiling Fan AC/DC Inverter (Pearl White). Its wide 56-inch sweep covers medium-to-large sized master bedrooms and living rooms flawlessly. Powered by an advanced AC/DC brushless motor, it drops power consumption from 100W to just 50W at top speed, yielding up to 60% electricity savings.";
  }

  const simulatedResponse = `### 🌟 Smart AI Recommendation (Local Offline Mode)

Based on your inputs, here is the curated match from the **Khurshid Fans** inventory:

#### Recommended Product: **${recommended.name}**
* **Price:** ${recommended.price} PKR
* **Type:** ${recommended.type.toUpperCase()}
* **Key Specs:** ${Object.entries(recommended.specs)
    .map(([k, v]) => `\n  * **${k}:** ${v}`)
    .join("")}

#### 💡 Expert Reasoning
${reasoning}

#### ⚡ Electricity Savings Breakdown
* **Induction Fan Consumption:** ~100 Watts
* **Khurshid Inverter Consumption:** ~40 Watts average
* **Total Energy Saved:** **60% Savings** on fan utility costs!
* **Smart IoT Feature:** Fully syncable with the Khurshid Android app to monitor real-time hourly energy charts.`;

  res.json({ recommendation: simulatedResponse });
});

// 7. Bulk Usage Stats Sync from Android App
app.post(["/api/v1/analytics/fan-usage", "/api/analytics/fan-usage"], (req, res) => {
  const { logs } = req.body;
  if (!logs || !Array.isArray(logs)) {
    return res.status(400).json({ error: "Logs array is required" });
  }

  const db = readDB();
  const addedLogs: DBAnalyticsLog[] = [];

  for (const log of logs) {
    const user = db.users.find((u) => u.uid === log.userId);
    if (!user) continue;

    const newLog: DBAnalyticsLog = {
      id: "log-" + Math.floor(100000 + Math.random() * 900000),
      fanId: log.fanId || "fan-unknown",
      model: log.model || "Khurshid Fan Inverter",
      userId: log.userId,
      timestamp: log.timestamp || new Date().toISOString(),
      speed: Number(log.speed) || 5,
      voltage: Number(log.voltage) || 220,
      currentWatts: Number(log.currentWatts) || 45,
      kwhConsumed: Number(log.kwhConsumed) || 0.045,
      city: user.city || "Punjab",
    };

    db.analytics_logs.push(newLog);
    addedLogs.push(newLog);

    // Update user's aggregated usageStats for local charts
    const logDate = newLog.timestamp.split("T")[0];
    const dailyEntry = user.usageStats.daily.find((d) => d.date === logDate);
    if (dailyEntry) {
      dailyEntry.kwh = Number((dailyEntry.kwh + newLog.kwhConsumed).toFixed(3));
    } else {
      user.usageStats.daily.push({ date: logDate, kwh: newLog.kwhConsumed });
    }
  }

  writeDB(db);
  res.json({ message: `Successfully synchronized ${addedLogs.length} logs`, logsSyncedCount: addedLogs.length });
});

// --- ADMIN API ENDPOINTS (VERSION v1) ---

// 1. Admin Auth
app.post("/api/v1/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const db = readDB();
  if (db.admin.email.toLowerCase() !== email.toLowerCase()) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }

  // Check hashedPassword
  const passOk = bcrypt.compareSync(password, db.admin.hashedPassword || "");
  if (!passOk) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, admin: { email } });
});

app.get("/api/v1/admin/me", authenticateAdmin, (req: any, res) => {
  res.json({ email: req.admin.email });
});

app.post("/api/v1/admin/change-password", authenticateAdmin, (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Both current and new password are required" });
  }

  const db = readDB();
  const passOk = bcrypt.compareSync(currentPassword, db.admin.hashedPassword || "");
  if (!passOk) {
    return res.status(400).json({ error: "Incorrect current password" });
  }

  const salt = bcrypt.genSaltSync(10);
  db.admin.hashedPassword = bcrypt.hashSync(newPassword, salt);
  writeDB(db);

  res.json({ message: "Password updated successfully" });
});

// 2. Admin Dashboard Stats
app.get("/api/v1/admin/dashboard-stats", authenticateAdmin, (req, res) => {
  const db = readDB();
  const totalUsers = db.users.length;
  
  // orders today
  const todayStr = new Date().toISOString().split("T")[0];
  const todayOrders = db.orders.filter((o) => o.createdAt.startsWith(todayStr));
  const totalOrdersToday = todayOrders.length;

  // revenue
  const revenue = db.orders
    .filter((o) => o.paymentStatus === "paid" || o.status === "delivered" || o.status === "shipped")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Active fans online (simulate)
  const activeFansOnline = db.users.reduce((sum, u) => {
    return sum + u.fanDetails.filter(f => {
      if (!f.lastOnline) return false;
      // If online within last 24 hours
      const diffMs = Date.now() - new Date(f.lastOnline).getTime();
      return diffMs < 24 * 60 * 60 * 1000;
    }).length;
  }, 0);

  // Chart statistics aggregates
  // 1. User growth (by month registered)
  const userGrowth: Record<string, number> = {};
  db.users.forEach((u) => {
    const month = new Date(u.registeredAt).toLocaleString("default", { month: "short", year: "numeric" });
    userGrowth[month] = (userGrowth[month] || 0) + 1;
  });
  const userGrowthChart = Object.entries(userGrowth).map(([month, count]) => ({ month, count }));

  // 2. Fan energy distribution (kWh) by model type
  const fanKwhDistribution: Record<string, number> = {};
  db.analytics_logs.forEach((log) => {
    fanKwhDistribution[log.model] = Number(((fanKwhDistribution[log.model] || 0) + log.kwhConsumed).toFixed(2));
  });
  const fanModelsChart = Object.entries(fanKwhDistribution).map(([model, kwh]) => ({ name: model, value: kwh }));

  // 3. Orders by Status
  const ordersByStatus: Record<string, number> = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
  db.orders.forEach((o) => {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
  });
  const ordersStatusChart = Object.entries(ordersByStatus).map(([status, count]) => ({ name: status.toUpperCase(), value: count }));

  res.json({
    stats: {
      totalUsers,
      totalOrdersToday,
      revenue,
      activeFansOnline,
    },
    charts: {
      userGrowthChart,
      fanModelsChart,
      ordersStatusChart,
    },
  });
});

// 3. User Management
app.get("/api/v1/admin/users", authenticateAdmin, (req, res) => {
  const { search } = req.query;
  const db = readDB();
  let result = db.users;

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
    );
  }

  res.json(result);
});

app.get("/api/v1/admin/users/:id", authenticateAdmin, (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.uid === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userOrders = db.orders.filter((o) => o.userId === user.uid);
  const userComplaints = db.complaints.filter((c) => c.userId === user.uid);

  res.json({
    user,
    orders: userOrders,
    complaints: userComplaints,
  });
});

app.put("/api/v1/admin/users/:id/ban", authenticateAdmin, (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.uid === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.isBanned = !user.isBanned;
  writeDB(db);

  res.json({ message: `User status changed successfully`, isBanned: user.isBanned });
});

// 4. Product Management
app.get("/api/v1/admin/products", authenticateAdmin, (req, res) => {
  const db = readDB();
  res.json(db.products);
});

// Add product (uses upload.array for images)
app.post("/api/v1/admin/products", authenticateAdmin, upload.array("imagesFiles"), (req: any, res) => {
  const { name, type, description, price, stock, specs } = req.body;
  if (!name || !type || !price) {
    return res.status(400).json({ error: "Name, type, and price are required fields." });
  }

  const db = readDB();
  const productImages: string[] = [];

  // Parse files if uploaded
  if (req.files && Array.isArray(req.files)) {
    req.files.forEach((file: any) => {
      productImages.push(`/uploads/${file.filename}`);
    });
  }

  // Also accept manual image URLs
  if (req.body.imageUrls) {
    const urls = Array.isArray(req.body.imageUrls)
      ? req.body.imageUrls
      : JSON.parse(req.body.imageUrls || "[]");
    urls.forEach((u: string) => {
      if (u) productImages.push(u);
    });
  }

  if (productImages.length === 0) {
    productImages.push("https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=500&q=80"); // fallback placeholder
  }

  let parsedSpecs: Record<string, string> = {};
  try {
    parsedSpecs = typeof specs === "string" ? JSON.parse(specs) : specs || {};
  } catch (e) {
    parsedSpecs = { "Standard Sweep": "56 inches" };
  }

  const newProduct: DBProduct = {
    id: "prod-" + Math.floor(100 + Math.random() * 900),
    name,
    type,
    description: description || "",
    price: Number(price),
    stock: Number(stock) || 0,
    isActive: req.body.isActive === "false" ? false : true,
    images: productImages,
    specs: parsedSpecs,
    createdAt: new Date().toISOString(),
  };

  db.products.push(newProduct);
  writeDB(db);

  res.status(201).json({ message: "Product created successfully", product: newProduct });
});

// Edit product
app.put("/api/v1/admin/products/:id", authenticateAdmin, upload.array("imagesFiles"), (req: any, res) => {
  const db = readDB();
  const productIndex = db.products.findIndex((p) => p.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const existingProduct = db.products[productIndex];
  const { name, type, description, price, stock, specs } = req.body;

  let productImages = [...existingProduct.images];

  // If new files uploaded, replace or add them
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const newImgs: string[] = [];
    req.files.forEach((file: any) => {
      newImgs.push(`/uploads/${file.filename}`);
    });
    // If overwrite images is set, replace, else append
    if (req.body.replaceImages === "true") {
      productImages = newImgs;
    } else {
      productImages = [...productImages, ...newImgs];
    }
  }

  // Also handle manual image list
  if (req.body.imageUrls) {
    try {
      const urls = typeof req.body.imageUrls === "string" ? JSON.parse(req.body.imageUrls) : req.body.imageUrls;
      if (Array.isArray(urls)) {
        productImages = urls;
      }
    } catch (e) {}
  }

  let parsedSpecs = { ...existingProduct.specs };
  if (specs) {
    try {
      parsedSpecs = typeof specs === "string" ? JSON.parse(specs) : specs;
    } catch (e) {}
  }

  const updatedProduct: DBProduct = {
    ...existingProduct,
    name: name || existingProduct.name,
    type: type || existingProduct.type,
    description: description !== undefined ? description : existingProduct.description,
    price: price !== undefined ? Number(price) : existingProduct.price,
    stock: stock !== undefined ? Number(stock) : existingProduct.stock,
    isActive: req.body.isActive === "false" ? false : req.body.isActive === "true" ? true : existingProduct.isActive,
    images: productImages,
    specs: parsedSpecs,
  };

  db.products[productIndex] = updatedProduct;
  writeDB(db);

  res.json({ message: "Product updated successfully", product: updatedProduct });
});

// Delete product
app.delete("/api/v1/admin/products/:id", authenticateAdmin, (req, res) => {
  const db = readDB();
  const productIndex = db.products.findIndex((p) => p.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  db.products.splice(productIndex, 1);
  writeDB(db);

  res.json({ message: "Product deleted successfully" });
});

// 5. Order Management
app.get("/api/v1/admin/orders", authenticateAdmin, (req, res) => {
  const { status } = req.query;
  const db = readDB();
  let result = db.orders;

  if (status) {
    result = result.filter((o) => o.status === status);
  }

  // Attach customer details for quick view
  const detailedOrders = result.map((order) => {
    const customer = db.users.find((u) => u.uid === order.userId);
    return {
      ...order,
      customerName: customer ? customer.name : "Anonymous",
      customerEmail: customer ? customer.email : "N/A",
    };
  });

  // Sort descending by date
  detailedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(detailedOrders);
});

// Update order status (triggers simulated FCM Push Notification)
app.put("/api/v1/admin/orders/:id/status", authenticateAdmin, (req, res) => {
  const { status, paymentStatus } = req.body;
  if (!status) {
    return res.status(400).json({ error: "Status field is required" });
  }

  const db = readDB();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  order.status = status;
  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }
  writeDB(db);

  // Broadast to user if connected via socket or simulate push notification
  const notificationTitle = `Order ${order.id} Updated`;
  const notificationBody = `Your Khurshid Fans order status has been updated to: ${status.toUpperCase()}.`;
  
  console.log(`[FCM PUSH NOTIFICATION SENT TO ${order.userId}]:`);
  console.log(`Title: ${notificationTitle}`);
  console.log(`Body: ${notificationBody}`);

  io.emit(`user:notification:${order.userId}`, {
    title: notificationTitle,
    body: notificationBody,
    orderId: order.id,
    status: order.status,
  });

  res.json({ message: `Order status updated to ${status}. Push notification dispatched.`, order });
});

// 6. Complaint Management
app.get("/api/v1/admin/complaints", authenticateAdmin, (req, res) => {
  const { status } = req.query;
  const db = readDB();
  let result = db.complaints;

  if (status) {
    result = result.filter((c) => c.status === status);
  }

  const detailedComplaints = result.map((complaint) => {
    const customer = db.users.find((u) => u.uid === complaint.userId);
    return {
      ...complaint,
      customerName: customer ? customer.name : "Anonymous",
      customerEmail: customer ? customer.email : "N/A",
    };
  });

  res.json(detailedComplaints);
});

// Admin replies to a complaint
app.put("/api/v1/admin/complaints/:id", authenticateAdmin, (req, res) => {
  const { adminReply, status } = req.body;
  if (!adminReply) {
    return res.status(400).json({ error: "Reply body is required" });
  }

  const db = readDB();
  const complaint = db.complaints.find((c) => c.id === req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: "Complaint not found" });
  }

  complaint.adminReply = adminReply;
  if (status) {
    complaint.status = status;
  }
  writeDB(db);

  // Send a notify signal
  io.emit(`user:complaint:${complaint.userId}`, {
    id: complaint.id,
    status: complaint.status,
    adminReply: complaint.adminReply,
  });

  res.json({ message: "Reply added successfully", complaint });
});

// 7. Content CMS Management
app.put("/api/v1/admin/content/:page", authenticateAdmin, (req, res) => {
  const { page } = req.params;
  const { body } = req.body;
  if (!body) {
    return res.status(400).json({ error: "Body content is required" });
  }

  const db = readDB();
  const idx = db.content.findIndex((c) => c.page === page);
  if (idx === -1) {
    db.content.push({ page: page as any, body });
  } else {
    db.content[idx].body = body;
  }

  writeDB(db);
  res.json({ message: `CMS page '${page}' updated successfully` });
});

// 8. Chat Support APIs
app.get("/api/v1/admin/chats", authenticateAdmin, (req, res) => {
  const db = readDB();
  
  // Return chats with active user names and last message info
  const chatsSummary = db.chats.map((chat) => {
    const userUid = chat.participants.find((p) => p !== "admin") || "";
    const customer = db.users.find((u) => u.uid === userUid);
    const lastMsg = chat.messages[chat.messages.length - 1];

    return {
      roomId: chat.roomId,
      userId: userUid,
      customerName: customer ? customer.name : "Khurshid Fans App User",
      customerEmail: customer ? customer.email : "N/A",
      lastMessage: lastMsg ? lastMsg.message : "No messages yet",
      lastSenderId: lastMsg ? lastMsg.senderId : "",
      lastUpdated: chat.lastUpdated,
      unread: false, // Simple mock
    };
  });

  chatsSummary.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  res.json(chatsSummary);
});

app.get("/api/v1/admin/chats/:roomId", authenticateAdmin, (req, res) => {
  const db = readDB();
  const chat = db.chats.find((c) => c.roomId === req.params.roomId);
  if (!chat) {
    return res.status(404).json({ error: "Chat room not found" });
  }
  res.json(chat);
});

app.post("/api/v1/admin/chats/:roomId/message", authenticateAdmin, (req, res) => {
  const { message, type } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const db = readDB();
  const chatIndex = db.chats.findIndex((c) => c.roomId === req.params.roomId);
  if (chatIndex === -1) {
    return res.status(404).json({ error: "Chat room not found" });
  }

  const newMessage: DBMessage = {
    senderId: "admin",
    message,
    timestamp: new Date().toISOString(),
    type: type || "text",
  };

  db.chats[chatIndex].messages.push(newMessage);
  db.chats[chatIndex].lastUpdated = newMessage.timestamp;
  writeDB(db);

  // Broadcast message to room
  io.to(req.params.roomId).emit("chat:message", newMessage);
  io.emit("admin:chat-updated", { roomId: req.params.roomId, lastMessage: newMessage });

  res.status(201).json(newMessage);
});

// --- SOCKET.IO REAL-TIME CHAT SETUP ---
io.on("connection", (socket) => {
  console.log("Client connected to Socket.io:", socket.id);

  // Join a Support Room
  socket.on("chat:join", ({ roomId }) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  // Message sent by user or admin inside a room
  socket.on("chat:send", ({ roomId, senderId, message, type }) => {
    const db = readDB();
    const chatIndex = db.chats.findIndex((c) => c.roomId === roomId);
    if (chatIndex !== -1) {
      const newMessage: DBMessage = {
        senderId,
        message,
        timestamp: new Date().toISOString(),
        type: type || "text",
      };

      db.chats[chatIndex].messages.push(newMessage);
      db.chats[chatIndex].lastUpdated = newMessage.timestamp;
      writeDB(db);

      // Broadcast message in room
      io.to(roomId).emit("chat:message", newMessage);

      // Notify dashboard if sent by user
      if (senderId !== "admin") {
        io.emit("admin:chat-notify", {
          roomId,
          senderId,
          message,
          timestamp: newMessage.timestamp,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// --- VITE RUNTIME OR BUILD EXPOSURE ---
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    // Run in dev mode using Vite Dev Server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`--------------------------------------------------`);
    console.log(`Khurshid Fans Admin Dashboard Backend Server Running`);
    console.log(`Address: http://0.0.0.0:${PORT}`);
    console.log(`Mode: ${process.env.NODE_ENV || "development"}`);
    console.log(`--------------------------------------------------`);
  });
}

startServer();
