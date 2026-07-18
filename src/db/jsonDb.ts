import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// Database storage location
const DB_FILE = path.join(process.cwd(), "src", "db", "db.json");

export interface DBUser {
  uid: string; // Firebase UID
  email: string;
  name: string;
  phone: string;
  city: string;
  locationHistory: { lat: number; lng: number; timestamp: string }[];
  registeredAt: string;
  fanDetails: {
    fanId: string;
    model: string;
    serial: string;
    location: string;
    addedAt: string;
    lastOnline?: string;
  }[];
  usageStats: {
    daily: { date: string; kwh: number }[];
    weekly: { week: string; kwh: number }[];
    monthly: { month: string; kwh: number }[];
  };
  chatRooms: string[];
  isBanned?: boolean;
}

export interface DBProduct {
  id: string;
  name: string;
  type: "ceiling" | "pedestal" | "bracket" | "exhaust";
  description: string;
  specs: Record<string, string>;
  images: string[];
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

export interface DBOrder {
  id: string;
  userId: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  shippingAddress: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
}

export interface DBComplaint {
  id: string;
  userId: string;
  subject: string;
  description: string;
  imageUrl?: string;
  status: "open" | "in-progress" | "resolved";
  adminReply?: string;
  createdAt: string;
}

export interface DBContent {
  page: "about" | "contact" | "faqs";
  body: string;
}

export interface DBMessage {
  senderId: string; // userId or 'admin'
  message: string;
  timestamp: string;
  type: "text" | "image";
}

export interface DBChat {
  roomId: string;
  participants: string[]; // [userId, 'admin']
  messages: DBMessage[];
  lastUpdated: string;
}

export interface DBAnalyticsLog {
  id: string;
  fanId: string;
  model: string;
  userId: string;
  timestamp: string;
  speed: number;
  voltage: number;
  currentWatts: number;
  kwhConsumed: number;
  city: string;
}

export interface DatabaseSchema {
  users: DBUser[];
  products: DBProduct[];
  orders: DBOrder[];
  complaints: DBComplaint[];
  content: DBContent[];
  chats: DBChat[];
  admin: {
    email: string;
    hashedPassword?: string;
  };
  analytics_logs: DBAnalyticsLog[];
}

// Function to read the DB
export function readDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Create folder if not exists
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const initial = getSeedData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database file", err);
    return getSeedData();
  }
}

// Function to write to the DB
export function writeDB(data: DatabaseSchema): void {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to database file", err);
  }
}

function getSeedData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync("admin123", salt);

  return {
    admin: {
      email: "admin@khurshidfans.com",
      hashedPassword: hashedPassword,
    },
    products: [
      {
        id: "prod-1",
        name: "Khurshid Ceiling Fan AC/DC Inverter - Pearl White",
        type: "ceiling",
        description: "<p>The premier AC/DC Inverter Ceiling Fan from Khurshid Fans, offering unparalleled energy savings of up to 60%. Equipped with high-grade copper windings and rust-proof aluminum blades. Extremely quiet double ball bearing motor. Includes multi-functional RF remote control and IoT-ready controller for smart application syncing.</p>",
        specs: {
          "Sweep Size": "56 inches (1400mm)",
          "Power Consumption": "3W - 50W (Speed 1 to 5)",
          "Voltage Range": "90V - 260V AC / 12V DC",
          "Air Delivery": "280 CMM",
          "Rated Speed": "350 RPM",
          "Copper Purity": "99.9% Super Enameled Copper Wire",
          "Warranty": "2 Years Motor & Parts"
        },
        images: [
          "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=500&q=80",
          "https://images.unsplash.com/photo-1618944847023-38aa36895881?w=500&q=80"
        ],
        price: 8500,
        stock: 120,
        isActive: true,
        createdAt: new Date("2026-01-10T10:00:00Z").toISOString(),
      },
      {
        id: "prod-2",
        name: "Khurshid Pedestal Fan AC/DC Inverter - Jet Black",
        type: "pedestal",
        description: "<p>Elegantly designed floor-standing pedestal fan with adjustable height and fully functional remote control. Uses an advanced AC/DC brushless motor to deliver massive airflow while consuming only 45W of electricity. Perfect for dining halls, gardens, and drawing rooms.</p>",
        specs: {
          "Sweep Size": "18 inches (450mm)",
          "Power Consumption": "4W - 45W",
          "Height Range": "3.5 feet - 5 feet",
          "Air Delivery": "120 CMM",
          "Blades": "5 Leaf ABS Aero-Blades",
          "Warranty": "1 Year"
        },
        images: [
          "https://images.unsplash.com/photo-1618944847958-36c1e540f3c5?w=500&q=80"
        ],
        price: 9500,
        stock: 80,
        isActive: true,
        createdAt: new Date("2026-02-15T11:00:00Z").toISOString(),
      },
      {
        id: "prod-3",
        name: "Khurshid Bracket Fan AC/DC Inverter - Charcoal Grey",
        type: "bracket",
        description: "<p>Compact, wall-mounted bracket fan with wide-angle oscillation and dual pull-cord controls. Ideal for offices, small shops, and kitchens. Fully integrated with micro-controller cards for smooth operations on low solar voltages as well.</p>",
        specs: {
          "Sweep Size": "16 inches (400mm)",
          "Power Consumption": "3W - 38W",
          "Oscillation Angle": "90 degrees",
          "Air Delivery": "85 CMM",
          "Warranty": "1 Year Motor"
        },
        images: [
          "https://images.unsplash.com/photo-1558882224-cca166733360?w=500&q=80"
        ],
        price: 7500,
        stock: 45,
        isActive: true,
        createdAt: new Date("2026-03-20T12:00:00Z").toISOString(),
      },
      {
        id: "prod-4",
        name: "Khurshid Ceiling Fan - Royal Gold Premium",
        type: "ceiling",
        description: "<p>A luxurious addition to your master bedroom. Adorned with royal golden filigree and high-gloss metallic paint. Features standard power delivery with optimized air performance. Robust motor architecture that withstands voltage fluctuations easily.</p>",
        specs: {
          "Sweep Size": "56 inches (1400mm)",
          "Power Consumption": "75W (Standard Motor)",
          "Air Delivery": "260 CMM",
          "Speed": "330 RPM",
          "Warranty": "3 Years Standard Motor"
        },
        images: [
          "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&q=80"
        ],
        price: 6500,
        stock: 150,
        isActive: true,
        createdAt: new Date("2026-04-01T09:00:00Z").toISOString(),
      },
      {
        id: "prod-5",
        name: "Khurshid Heavy Duty Exhaust Fan 12\"",
        type: "exhaust",
        description: "<p>Heavy duty kitchen and washroom exhaust fan with automated louvers that shut when turned off to prevent insects from entering. Silent operation high-speed motor designed for long continuous cycles.</p>",
        specs: {
          "Sweep Size": "12 inches (300mm)",
          "Power Consumption": "40W",
          "Speed": "1400 RPM",
          "Louver System": "Automatic Gravity Shutter",
          "Warranty": "1 Year"
        },
        images: [
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&q=80"
        ],
        price: 3200,
        stock: 200,
        isActive: true,
        createdAt: new Date("2026-04-10T15:00:00Z").toISOString(),
      }
    ],
    users: [
      {
        uid: "user-ali-123",
        email: "ali@example.com",
        name: "Muhammad Ali",
        phone: "+923001234567",
        city: "Lahore",
        locationHistory: [
          { lat: 31.5204, lng: 74.3587, timestamp: "2026-05-10T12:00:00Z" }
        ],
        registeredAt: "2026-05-10T12:00:00Z",
        fanDetails: [
          {
            fanId: "fan-1",
            model: "Khurshid Ceiling Fan AC/DC Inverter - Pearl White",
            serial: "KF-CF-9901",
            location: "Living Room",
            addedAt: "2026-05-11",
            lastOnline: "2026-07-17T23:45:00Z"
          },
          {
            fanId: "fan-2",
            model: "Khurshid Bracket Fan AC/DC Inverter - Charcoal Grey",
            serial: "KF-BF-8812",
            location: "Kitchen",
            addedAt: "2026-05-15",
            lastOnline: "2026-07-17T20:10:00Z"
          }
        ],
        usageStats: {
          daily: [
            { date: "2026-07-11", kwh: 1.2 },
            { date: "2026-07-12", kwh: 1.4 },
            { date: "2026-07-13", kwh: 1.5 },
            { date: "2026-07-14", kwh: 1.8 },
            { date: "2026-07-15", kwh: 2.1 },
            { date: "2026-07-16", kwh: 1.9 },
            { date: "2026-07-17", kwh: 1.7 }
          ],
          weekly: [
            { week: "W25", kwh: 10.5 },
            { week: "W26", kwh: 11.2 },
            { week: "W27", kwh: 12.4 },
            { week: "W28", kwh: 11.9 }
          ],
          monthly: [
            { month: "May", kwh: 35.2 },
            { month: "Jun", kwh: 48.6 },
            { month: "Jul", kwh: 24.5 }
          ]
        },
        chatRooms: ["ali-chat-room"]
      },
      {
        uid: "user-ayesha-456",
        email: "ayesha@example.com",
        name: "Ayesha Khan",
        phone: "+923219876543",
        city: "Karachi",
        locationHistory: [
          { lat: 24.8607, lng: 67.0011, timestamp: "2026-06-01T15:30:00Z" }
        ],
        registeredAt: "2026-06-01T15:30:00Z",
        fanDetails: [
          {
            fanId: "fan-3",
            model: "Khurshid Pedestal Fan AC/DC Inverter - Jet Black",
            serial: "KF-PF-4451",
            location: "Drawing Room",
            addedAt: "2026-06-02",
            lastOnline: "2026-07-17T22:30:00Z"
          }
        ],
        usageStats: {
          daily: [
            { date: "2026-07-11", kwh: 0.8 },
            { date: "2026-07-12", kwh: 0.9 },
            { date: "2026-07-13", kwh: 1.1 },
            { date: "2026-07-14", kwh: 1.2 },
            { date: "2026-07-15", kwh: 1.5 },
            { date: "2026-07-16", kwh: 1.3 },
            { date: "2026-07-17", kwh: 1.1 }
          ],
          weekly: [
            { week: "W25", kwh: 6.8 },
            { week: "W26", kwh: 7.2 },
            { week: "W27", kwh: 8.5 },
            { week: "W28", kwh: 8.1 }
          ],
          monthly: [
            { month: "Jun", kwh: 28.4 },
            { month: "Jul", kwh: 16.5 }
          ]
        },
        chatRooms: ["ayesha-chat-room"]
      },
      {
        uid: "user-zainab-789",
        email: "zainab@example.com",
        name: "Zainab Bibi",
        phone: "+923334445555",
        city: "Islamabad",
        locationHistory: [
          { lat: 33.6844, lng: 73.0479, timestamp: "2026-06-15T09:00:00Z" }
        ],
        registeredAt: "2026-06-15T09:00:00Z",
        fanDetails: [
          {
            fanId: "fan-4",
            model: "Khurshid Ceiling Fan - Royal Gold Premium",
            serial: "KF-CF-3302",
            location: "Master Bed",
            addedAt: "2026-06-16",
            lastOnline: "2026-07-16T15:45:00Z"
          }
        ],
        usageStats: {
          daily: [
            { date: "2026-07-11", kwh: 2.2 },
            { date: "2026-07-12", kwh: 2.5 },
            { date: "2026-07-13", kwh: 2.4 },
            { date: "2026-07-14", kwh: 2.8 },
            { date: "2026-07-15", kwh: 2.9 },
            { date: "2026-07-16", kwh: 2.7 },
            { date: "2026-07-17", kwh: 2.6 }
          ],
          weekly: [
            { week: "W25", kwh: 15.4 },
            { week: "W26", kwh: 16.8 },
            { week: "W27", kwh: 18.2 },
            { week: "W28", kwh: 17.5 }
          ],
          monthly: [
            { month: "Jun", kwh: 34.5 },
            { month: "Jul", kwh: 38.2 }
          ]
        },
        chatRooms: ["zainab-chat-room"]
      }
    ],
    orders: [
      {
        id: "ord-1001",
        userId: "user-ali-123",
        items: [
          { productId: "prod-1", name: "Khurshid Ceiling Fan AC/DC Inverter - Pearl White", quantity: 2, price: 8500 }
        ],
        totalAmount: 17000,
        shippingAddress: "House 45, Street 2, DHA Phase 5, Lahore",
        status: "delivered",
        paymentStatus: "paid",
        createdAt: "2026-05-12T10:00:00Z"
      },
      {
        id: "ord-1002",
        userId: "user-ayesha-456",
        items: [
          { productId: "prod-2", name: "Khurshid Pedestal Fan AC/DC Inverter - Jet Black", quantity: 1, price: 9500 }
        ],
        totalAmount: 9500,
        shippingAddress: "Apartment 4B, Creek Vista, Phase 8, Clifton, Karachi",
        status: "shipped",
        paymentStatus: "paid",
        createdAt: "2026-07-15T11:00:00Z"
      },
      {
        id: "ord-1003",
        userId: "user-zainab-789",
        items: [
          { productId: "prod-3", name: "Khurshid Bracket Fan AC/DC Inverter - Charcoal Grey", quantity: 1, price: 7500 },
          { productId: "prod-5", name: "Khurshid Heavy Duty Exhaust Fan 12\"", quantity: 1, price: 3200 }
        ],
        totalAmount: 10700,
        shippingAddress: "House 122, G-11/2, Islamabad",
        status: "pending",
        paymentStatus: "pending",
        createdAt: "2026-07-17T16:00:00Z"
      }
    ],
    complaints: [
      {
        id: "comp-201",
        userId: "user-ali-123",
        subject: "Noise issue in Ceiling Fan",
        description: "The Living Room ceiling fan is making a clicking noise when running at speed 4. It only happens after running for 20 minutes.",
        status: "in-progress",
        adminReply: "Dear Ali, we have assigned our technician from the Lahore Service Center. They will contact you shortly to schedule a home visit and examine the capacitor or double bearings.",
        createdAt: "2026-07-14T08:00:00Z"
      },
      {
        id: "comp-202",
        userId: "user-ayesha-456",
        subject: "Remote Control malfunction",
        description: "The remote control buttons are hard to press and sometimes do not respond from a distance. The battery is fresh.",
        status: "resolved",
        adminReply: "A replacement RF remote has been dispatched to your Clifton address. Please allow 2-3 business days for delivery.",
        createdAt: "2026-07-02T14:00:00Z"
      }
    ],
    content: [
      {
        page: "about",
        body: "<h1>About Khurshid Fans</h1><p>Khurshid Fans is a leading manufacturer of premium, energy-efficient fans in Pakistan. We specialize in AC/DC inverter fans that save up to 60% electricity. Our smart fans can be controlled via remote or our mobile application.</p><p>We utilize 99.9% super enameled copper and electronic silicon steel sheets to maximize efficiency, air delivery, and longevity.</p>"
      },
      {
        page: "contact",
        body: "<h1>Contact Us</h1><p>For support or sales inquiries, please reach out to us:</p><ul><li><strong>Email:</strong> support@khurshidfans.com</li><li><strong>Phone:</strong> +92 53 111 222 333</li><li><strong>Address:</strong> Khurshid Fans Factory, GT Road, Gujrat, Punjab, Pakistan</li></ul><p>Our helpdesk is active Monday to Saturday, 9:00 AM to 6:00 PM.</p>"
      },
      {
        page: "faqs",
        body: "<h1>Frequently Asked Questions</h1><h3>1. How much energy do Khurshid inverter fans save?</h3><p>Our inverter fans save up to 60% electricity compared to traditional induction fans, consuming only 30W - 50W at speed 5 instead of 80W-100W.</p><h3>2. How do I pair my fan with the mobile app?</h3><p>Ensure the fan is powered on, launch the Khurshid Fans Android application, tap the '+' button, select 'Add Fan' and scan the serial QR code on the fan canopy or enter it manually.</p><h3>3. What is the voltage range for AC/DC operation?</h3><p>Our dual-power fans operate natively from 90V to 260V AC or directly from a 12V DC battery/solar system.</p>"
      }
    ],
    chats: [
      {
        roomId: "ali-chat-room",
        participants: ["user-ali-123", "admin"],
        messages: [
          {
            senderId: "user-ali-123",
            message: "Hello, I need some help regarding my fan's warranty.",
            timestamp: "2026-07-17T10:00:00Z",
            type: "text"
          },
          {
            senderId: "admin",
            message: "Hello Ali! I would be happy to assist you today. Please share your fan's model or serial number.",
            timestamp: "2026-07-17T10:02:00Z",
            type: "text"
          },
          {
            senderId: "user-ali-123",
            message: "The model is Khurshid Ceiling Fan AC/DC Inverter, serial: KF-CF-9901.",
            timestamp: "2026-07-17T10:05:00Z",
            type: "text"
          }
        ],
        lastUpdated: "2026-07-17T10:05:00Z"
      }
    ],
    analytics_logs: [
      {
        id: "log-1",
        fanId: "fan-1",
        model: "Khurshid Ceiling Fan AC/DC Inverter - Pearl White",
        userId: "user-ali-123",
        timestamp: "2026-07-17T12:00:00Z",
        speed: 5,
        voltage: 228,
        currentWatts: 48,
        kwhConsumed: 0.048,
        city: "Lahore"
      },
      {
        id: "log-2",
        fanId: "fan-1",
        model: "Khurshid Ceiling Fan AC/DC Inverter - Pearl White",
        userId: "user-ali-123",
        timestamp: "2026-07-17T13:00:00Z",
        speed: 4,
        voltage: 226,
        currentWatts: 35,
        kwhConsumed: 0.035,
        city: "Lahore"
      },
      {
        id: "log-3",
        fanId: "fan-2",
        model: "Khurshid Bracket Fan AC/DC Inverter - Charcoal Grey",
        userId: "user-ali-123",
        timestamp: "2026-07-17T14:00:00Z",
        speed: 3,
        voltage: 12.4, // DC Volt
        currentWatts: 24,
        kwhConsumed: 0.024,
        city: "Lahore"
      },
      {
        id: "log-4",
        fanId: "fan-3",
        model: "Khurshid Pedestal Fan AC/DC Inverter - Jet Black",
        userId: "user-ayesha-456",
        timestamp: "2026-07-17T15:00:00Z",
        speed: 5,
        voltage: 220,
        currentWatts: 44,
        kwhConsumed: 0.044,
        city: "Karachi"
      },
      {
        id: "log-5",
        fanId: "fan-4",
        model: "Khurshid Ceiling Fan - Royal Gold Premium",
        userId: "user-zainab-789",
        timestamp: "2026-07-17T16:00:00Z",
        speed: 3,
        voltage: 231,
        currentWatts: 75,
        kwhConsumed: 0.075,
        city: "Islamabad"
      }
    ]
  };
}
