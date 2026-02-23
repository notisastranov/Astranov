import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("omni.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    lat REAL,
    lng REAL,
    balance REAL DEFAULT 100.0,
    vehicle_details TEXT,
    insurance_info TEXT,
    is_verified_driver BOOLEAN DEFAULT 0,
    team_id TEXT,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT
  );

  CREATE TABLE IF NOT EXISTS team_members (
    team_id TEXT,
    user_id TEXT,
    PRIMARY KEY (team_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    amount REAL,
    type TEXT,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    amount REAL,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    creator_id TEXT,
    driver_id TEXT,
    shop_id TEXT,
    type TEXT,
    status TEXT,
    description TEXT,
    lat REAL,
    lng REAL,
    price REAL,
    weight REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY,
    owner_id TEXT,
    name TEXT,
    description TEXT,
    image_url TEXT,
    schedule TEXT,
    lat REAL,
    lng REAL,
    is_active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    shop_id TEXT,
    name TEXT,
    price REAL,
    image_url TEXT,
    available BOOLEAN,
    description TEXT,
    stock INTEGER DEFAULT 0
  );
`);

// Seed Mock Data
const seedData = () => {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  if (userCount < 13) {
    for (let i = 1; i <= 13; i++) {
      const id = `user-${i}`;
      const name = `Citizen ${i}`;
      const role = i === 1 ? 'admin' : (i % 3 === 0 ? 'deliverer' : (i % 3 === 1 ? 'customer' : 'vendor'));
      const lat = 40.7128 + (Math.random() - 0.5) * 0.05;
      const lng = -74.0060 + (Math.random() - 0.5) * 0.05;
      db.prepare("INSERT OR IGNORE INTO users (id, name, role, lat, lng, balance) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, name, role, lat, lng, 500.0);

      if (role === 'vendor') {
        const shopId = `shop-${i}`;
        db.prepare("INSERT OR IGNORE INTO shops (id, owner_id, name, description, image_url, schedule, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .run(shopId, id, `Astranov Shop ${i}`, `The best shop in district ${i}`, `https://picsum.photos/seed/shop${i}/400/300`, '{"mon": "09:00-21:00"}', lat, lng);
        
        for (let j = 1; j <= 5; j++) {
          db.prepare("INSERT OR IGNORE INTO products (id, shop_id, name, price, image_url, available, description, stock) VALUES (?, ?, ?, ?, ?, 1, ?, ?)")
            .run(`prod-${i}-${j}`, shopId, `Product ${i}-${j}`, 10 + Math.random() * 50, `https://picsum.photos/seed/prod${i}${j}/200/200`, `Description for product ${j}`, 50);
        }
      }

      // Create 13 Offers (Tasks)
      const taskId = `task-seed-${i}`;
      db.prepare("INSERT OR IGNORE INTO tasks (id, creator_id, type, status, description, lat, lng, price, weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(taskId, id, 'delivery', 'pending_driver', `Delivery offer ${i}`, lat + 0.001, lng + 0.001, 5 + Math.random() * 20, 1 + Math.random() * 5);
      
      // Create 13 Team Members (Global Team)
      if (i === 1) {
        db.prepare("INSERT OR IGNORE INTO teams (id, name, type) VALUES (?, ?, ?)")
          .run('team-global', 'Global Team', 'global');
      }
      db.prepare("INSERT OR IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)")
        .run('team-global', id);
    }
  }
};
seedData();

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // Pricing Algorithm
  const calculatePrice = (distance: number, weight: number, isNight: boolean, isBadWeather: boolean) => {
    let price = Math.ceil(distance); // 1 euro per km
    if (isNight) price += 1;
    if (isBadWeather) price += 1;
    if (weight > 3) price += 1;
    return price;
  };

  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  });

  app.get("/api/transactions/:userId", (req, res) => {
    const transactions = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC").all(req.params.userId);
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { id, user_id, amount, type, description } = req.body;
    db.prepare("INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)")
      .run(id, user_id, amount, type, description);
    
    if (type === 'deposit') {
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, user_id);
    } else if (type === 'withdrawal') {
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, user_id);
    }
    
    res.json({ success: true });
  });

  app.get("/api/teams", (req, res) => {
    const teams = db.prepare("SELECT * FROM teams").all();
    const teamsWithMembers = teams.map(team => {
      const members = db.prepare("SELECT user_id FROM team_members WHERE team_id = ?").all(team.id);
      return { ...team, members: members.map(m => m.user_id) };
    });
    res.json(teamsWithMembers);
  });

  app.post("/api/teams", (req, res) => {
    const { id, name, type, members } = req.body;
    db.prepare("INSERT INTO teams (id, name, type) VALUES (?, ?, ?)")
      .run(id, name, type);
    
    if (members && Array.isArray(members)) {
      const stmt = db.prepare("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)");
      members.forEach(userId => stmt.run(id, userId));
    }
    res.json({ success: true });
  });

  app.get("/api/invoices/:taskId", (req, res) => {
    const invoice = db.prepare("SELECT * FROM invoices WHERE task_id = ?").get(req.params.taskId);
    res.json(invoice);
  });

  app.post("/api/invoices", (req, res) => {
    const { id, task_id, amount } = req.body;
    db.prepare("INSERT INTO invoices (id, task_id, amount, status) VALUES (?, ?, ?, 'pending')")
      .run(id, task_id, amount);
    res.json({ success: true });
  });

  // API Routes
  app.get("/api/users/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  app.post("/api/payment/complete", (req, res) => {
    const { taskId, creatorId, driverId, shopId, amount } = req.body;
    
    db.transaction(() => {
      // Deduct from client
      db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, creatorId);
      // Pay driver (e.g., 70% of delivery fee)
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount * 0.7, driverId);
      // Pay shop (e.g., product price - handled separately or included in total)
      // For simplicity, we'll assume the 'amount' is the delivery fee.
      
      db.prepare("UPDATE tasks SET status = 'completed' WHERE id = ?").run(taskId);
    })();
    
    res.json({ success: true });
  });

  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks WHERE status != 'completed'").all();
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { id, creator_id, type, description, lat, lng, price, weight, shop_id } = req.body;
    db.prepare("INSERT INTO tasks (id, creator_id, type, status, description, lat, lng, price, weight, shop_id) VALUES (?, ?, ?, 'pending_driver', ?, ?, ?, ?, ?, ?)")
      .run(id, creator_id, type, description, lat, lng, price, weight, shop_id);
    
    // Broadcast to all clients
    broadcast({ type: "task_created", data: { id, creator_id, type, description, lat, lng, price, weight, shop_id, status: 'pending_driver' } });
    res.json({ success: true });
  });

  app.post("/api/tasks/:id/accept", (req, res) => {
    const { driverId } = req.body;
    db.prepare("UPDATE tasks SET driver_id = ?, status = 'assigned' WHERE id = ?").run(driverId, req.params.id);
    
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    broadcast({ type: "task_updated", data: task });
    res.json({ success: true });
  });

  app.get("/api/shops", (req, res) => {
    const shops = db.prepare("SELECT * FROM shops").all();
    res.json(shops);
  });

  app.get("/api/products/search", (req, res) => {
    const query = req.query.q as string;
    const products = db.prepare("SELECT * FROM products WHERE name LIKE ? OR description LIKE ?").all(`%${query}%`, `%${query}%`);
    res.json(products);
  });

  app.get("/api/shops/:id/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products WHERE shop_id = ?").all(req.params.id);
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { id, shop_id, name, price, image_url, available, description, stock } = req.body;
    db.prepare("INSERT INTO products (id, shop_id, name, price, image_url, available, description, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, shop_id, name, price, image_url, available ? 1 : 0, description, stock);
    res.json({ success: true });
  });

  app.put("/api/users/:id/role", (req, res) => {
    const { role } = req.body;
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/users/:id/verify-driver", (req, res) => {
    const { vehicle, insurance } = req.body;
    db.prepare("UPDATE users SET vehicle_details = ?, insurance_info = ?, is_verified_driver = 1 WHERE id = ?")
      .run(vehicle, insurance, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/shops", (req, res) => {
    const { id, owner_id, name, description, image_url, schedule, lat, lng } = req.body;
    db.prepare("INSERT INTO shops (id, owner_id, name, description, image_url, schedule, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, owner_id, name, description, image_url, schedule, lat, lng);
    
    const newShop = { id, owner_id, name, description, image_url, schedule, lat, lng, is_active: 1 };
    broadcast({ type: "shop_created", data: newShop });
    res.json({ success: true });
  });

  // WebSocket Logic
  const clients = new Map<string, WebSocket>();

  wss.on("connection", (ws) => {
    let userId: string | null = null;

    ws.on("message", (message) => {
      const payload = JSON.parse(message.toString());

      switch (payload.type) {
        case "auth":
          userId = payload.userId;
          clients.set(userId!, ws);
          // Update user in DB
          db.prepare("INSERT OR REPLACE INTO users (id, name, role, lat, lng) VALUES (?, ?, ?, ?, ?)")
            .run(userId, payload.name, payload.role, payload.lat, payload.lng);
          break;

        case "update_location":
          if (userId) {
            db.prepare("UPDATE users SET lat = ?, lng = ?, role = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?")
              .run(payload.lat, payload.lng, payload.role, userId);
            // Broadcast location update to others
            broadcast({ 
              type: "user_moved", 
              data: { userId, lat: payload.lat, lng: payload.lng, role: payload.role } 
            }, ws);
          }
          break;
      }
    });

    ws.on("close", () => {
      if (userId) clients.delete(userId);
    });
  });

  function broadcast(data: any, excludeWs?: WebSocket) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
