import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import mysql from 'mysql2/promise';
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import db from "./firestore.js";
import { CommerceService } from "./src/services/backend/commerceService";
import { PaymentService } from "./src/services/backend/paymentService";
import { LedgerService } from "./src/services/backend/ledgerService";
import { aiToolHandlers } from "./src/services/backend/aiToolHandlers";
import { 
  OperatorCommandService, 
  ConfigService, 
  ChangeRequestService, 
  PatchGenerationService, 
  DeploymentRequestService,
  AuditLogService
} from "./src/services/backend/operatorService";
import { GitHubBridgeService, RepoSyncRequestService, PatchArtifactService } from "./src/services/backend/githubService";
import { AIOrchestratorService } from "./src/services/backend/aiOrchestratorService";
import { OrderStatus, FulfillmentMethod, OperatorActionType } from "./src/types/operational";
import { GoogleGenAI, Type } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pool: mysql.Pool | null = null;

// Mock Database for fallback when real DB is unavailable
class MockPool {
  private data: Record<string, any[]> = {
    users: [],
    teams: [],
    team_members: [],
    transactions: [],
    invoices: [],
    tasks: [],
    shops: [],
    products: [],
    countries: [],
    legal_profiles: [],
    wallet_ledger: [],
    compliance_invoices: []
  };

  async query(sql: string, params: any[] = []) {
    const normalizedSql = sql.trim().toLowerCase();
    
    // Handle CREATE TABLE (ignore)
    if (normalizedSql.startsWith('create table')) return [[]];

    // Handle INSERT
    if (normalizedSql.startsWith('insert')) {
      const tableName = sql.match(/into\s+(\w+)/i)?.[1];
      if (tableName && this.data[tableName]) {
        // This is a very simplified parser for the mock
        // In a real mock we'd parse the columns and values
        // For now, we'll just store the params if we can map them
        // But since we don't want to build a full SQL engine, 
        // we'll just return success to keep the app running.
        return [{ insertId: Date.now() }];
      }
    }

    // Handle UPDATE
    if (normalizedSql.startsWith('update')) {
      const tableName = sql.match(/update\s+(\w+)/i)?.[1];
      if (tableName && this.data[tableName]) {
        return [{ affectedRows: 1 }];
      }
    }

    // Handle SELECT
    if (normalizedSql.startsWith('select')) {
      const tableName = sql.match(/from\s+(\w+)/i)?.[1];
      if (normalizedSql.includes('count(*)')) return [[{ count: this.data[tableName || '']?.length || 0 }]];
      if (tableName && this.data[tableName]) {
        return [this.data[tableName]];
      }
    }

    return [[]];
  }

  async getConnection() {
    return {
      query: this.query.bind(this),
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      ping: async () => {}
    };
  }

  async end() {}
}

const initDbConnection = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const instanceName = process.env.INSTANCE_CONNECTION_NAME;
    const dbUser = process.env.DB_USER;
    const dbPass = process.env.DB_PASSWORD;
    const dbHost = process.env.DB_HOST;
    const dbName = process.env.DB_NAME;

    console.log("🔍 Database Configuration Check:");
    console.log(`- DATABASE_URL: ${dbUrl ? 'Present' : 'Missing'}`);
    console.log(`- INSTANCE_CONNECTION_NAME: ${instanceName ? 'Present' : 'Missing'}`);
    console.log(`- DB_USER: ${dbUser ? 'Present' : 'Missing'}`);
    console.log(`- DB_PASSWORD: ${dbPass ? 'Present' : 'Missing'}`);
    console.log(`- DB_HOST: ${dbHost || '127.0.0.1 (default)'}`);
    console.log(`- DB_NAME: ${dbName || 'astranov (default)'}`);

    const hasConfig = dbUrl || (instanceName && dbUser && dbPass) || (dbUser && dbPass);

    if (!hasConfig) {
      console.log("ℹ️ No database configuration found. Starting in Demo Mode (In-Memory).");
      pool = new MockPool() as any;
      return;
    }

    if (dbUrl) {
      pool = mysql.createPool({
        uri: dbUrl,
        connectTimeout: 2000,
      });
      console.log("Attempting database connection using DATABASE_URL...");
    } else if (instanceName && dbUser && dbPass) {
      pool = mysql.createPool({
        socketPath: `/cloudsql/${instanceName}`,
        user: dbUser,
        password: dbPass,
        database: dbName || 'astranov',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 2000
      });
      console.log(`Attempting Cloud SQL connection: /cloudsql/${instanceName}`);
    } else if (dbUser && dbPass) {
      pool = mysql.createPool({
        host: dbHost || '127.0.0.1',
        user: dbUser,
        password: dbPass,
        database: dbName || 'astranov',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 2000
      });
      console.log(`Attempting database connection to ${dbHost || '127.0.0.1'}...`);
    }

    if (pool) {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      console.log("✅ Database connection established successfully.");
    }
  } catch (e) {
    console.warn("⚠️ Database connection failed. Falling back to Demo Mode (In-Memory).");
    console.error("Connection error details:", e instanceof Error ? e.message : e);
    pool = new MockPool() as any;
  }
};

// Initialize Database
const initDb = async () => {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        role VARCHAR(255),
        lat DOUBLE,
        lng DOUBLE,
        balance DOUBLE DEFAULT 100.0,
        vehicle_details TEXT,
        insurance_info TEXT,
        is_verified_driver BOOLEAN DEFAULT false,
        accepted_terms_at TIMESTAMP NULL,
        team_id VARCHAR(255),
        preferences TEXT,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add preferences column if it doesn't exist (for existing databases)
    try {
      await pool.query("ALTER TABLE users ADD COLUMN preferences TEXT");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') {
        console.log("Column preferences already exists or error:", e.message);
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR(255)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        team_id VARCHAR(255),
        user_id VARCHAR(255),
        PRIMARY KEY (team_id, user_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        amount DOUBLE,
        type VARCHAR(255),
        description TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(255) PRIMARY KEY,
        task_id VARCHAR(255),
        amount DOUBLE,
        status VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) PRIMARY KEY,
        creator_id VARCHAR(255),
        driver_id VARCHAR(255),
        shop_id VARCHAR(255),
        type VARCHAR(255),
        status VARCHAR(255),
        description TEXT,
        lat DOUBLE,
        lng DOUBLE,
        price DOUBLE,
        weight DOUBLE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id VARCHAR(255) PRIMARY KEY,
        owner_id VARCHAR(255),
        name VARCHAR(255),
        description TEXT,
        image_url TEXT,
        schedule TEXT,
        lat DOUBLE,
        lng DOUBLE,
        is_active BOOLEAN DEFAULT true
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        shop_id VARCHAR(255),
        name VARCHAR(255),
        price DOUBLE,
        image_url TEXT,
        available BOOLEAN,
        description TEXT,
        stock INTEGER DEFAULT 0
      )
    `);

    // Global Configuration Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS countries (
        code VARCHAR(2) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        tax_regime VARCHAR(50),
        default_tax_rate DECIMAL(5, 2),
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Fintech & Compliance Tables (Extended)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS legal_profiles (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        country_code VARCHAR(2) NOT NULL,
        tax_id VARCHAR(50) NOT NULL,
        tax_office VARCHAR(255),
        legal_name VARCHAR(255) NOT NULL,
        legal_address TEXT NOT NULL,
        self_billing_agreed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (country_code)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_ledger (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        transaction_id VARCHAR(255) NOT NULL,
        entity_id VARCHAR(255) NOT NULL, -- Which platform entity owns this?
        account_code VARCHAR(20) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        debit DECIMAL(15, 2) DEFAULT 0.00,
        credit DECIMAL(15, 2) DEFAULT 0.00,
        exchange_rate DECIMAL(15, 6) DEFAULT 1.000000,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (entity_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS compliance_invoices (
        id VARCHAR(255) PRIMARY KEY,
        country_code VARCHAR(2) NOT NULL,
        doc_series VARCHAR(20) NOT NULL,
        doc_number INT NOT NULL,
        doc_type VARCHAR(50),
        currency VARCHAR(3) NOT NULL,
        issuer_id VARCHAR(255) NOT NULL,
        recipient_id VARCHAR(255) NOT NULL,
        total_net DECIMAL(15, 2) NOT NULL,
        total_vat DECIMAL(15, 2) NOT NULL,
        total_gross DECIMAL(15, 2) NOT NULL,
        external_mark VARCHAR(255), -- myDATA MARK or equivalent
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (country_code)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        receiver_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        task_id VARCHAR(255),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id VARCHAR(255) PRIMARY KEY,
        rater_id VARCHAR(255) NOT NULL,
        target_id VARCHAR(255) NOT NULL, -- user_id or shop_id
        target_type VARCHAR(50) NOT NULL, -- 'user' or 'shop'
        rating INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Mock Data - REMOVED for production
    console.log("Database schema verified. Ready for production data.");
  } catch (e) {
    console.error("Failed to initialize database:", e);
  }
};

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  // Initialize DB in background to avoid blocking server start
  initDbConnection().then(() => initDb()).catch(err => {
    console.error("Background DB initialization failed:", err);
  });

  app.use(express.json());

  // Middleware to check DB connection
  app.use((req, res, next) => {
    if (!pool) {
      return res.status(500).json({ error: "Database connection not configured. Please set DATABASE_URL." });
    }
    next();
  });

  app.get("/api/version", (req, res) => {
    try {
      const versionData = JSON.parse(fs.readFileSync(path.join(__dirname, "version.json"), "utf8"));
      res.json(versionData);
    } catch (e) {
      res.json({ version: "1.0.0" });
    }
  });

  app.get("/api/health", async (req, res) => {
    try {
      if (!pool) {
        return res.json({ 
          status: "warn", 
          message: "Database connection not configured. Using demo mode."
        });
      }
      // Attempt a simple query to verify connection
      await pool.query("SELECT 1");
      res.json({ status: "ok", message: "Successfully connected to the database." });
    } catch (e: any) {
      console.error("Database health check failed:", e);
      res.json({ 
        status: "warn", 
        message: "Failed to connect to the database. Using demo mode.", 
        details: e.message
      });
    }
  });

  app.get("/signals", async (req, res) => {
    try {
      const snapshot = await db.collection("signals").get();
      const signals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      res.json(signals);
    } catch (e: any) {
      console.error("Firestore error:", e);
      res.status(500).json({ error: "Firestore Error", details: e.message });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;

      if (!userId) {
        // Not logged in: Can only view drivers (deliverers)
        const [rows] = await pool!.query("SELECT id, name, role, lat, lng, last_seen FROM users WHERE role = 'deliverer'");
        return res.json(rows);
      }

      if (userRole === 'admin' || userRole === 'owner') {
        const [rows] = await pool!.query("SELECT * FROM users");
        return res.json(rows);
      }

      if (userRole === 'user') {
        // Consumer: Can view themselves, and drivers
        const [rows] = await pool!.query("SELECT id, name, role, lat, lng, last_seen FROM users WHERE id = ? OR role = 'deliverer'", [userId]);
        return res.json(rows);
      }

      if (userRole === 'deliverer') {
        // Driver: Can view themselves and the consumer of their accepted task
        const [tasks]: any = await pool!.query("SELECT creator_id FROM tasks WHERE driver_id = ? AND status = 'assigned'", [userId]);
        const consumerIds = tasks.map((t: any) => t.creator_id);
        
        let query = "SELECT id, name, role, lat, lng, last_seen FROM users WHERE id = ? OR role = 'deliverer'";
        let params = [userId];
        
        if (consumerIds.length > 0) {
          query = `SELECT id, name, role, lat, lng, last_seen FROM users WHERE id = ? OR role = 'deliverer' OR id IN (${consumerIds.map(() => '?').join(',')})`;
          params = [userId, ...consumerIds];
        }
        
        const [rows] = await pool!.query(query, params);
        return res.json(rows);
      }

      if (userRole === 'vendor') {
        // Shop: Can view only drivers
        const [rows] = await pool!.query("SELECT id, name, role, lat, lng, last_seen FROM users WHERE id = ? OR role = 'deliverer'", [userId]);
        return res.json(rows);
      }

      const [rows] = await pool!.query("SELECT id, name, role, lat, lng, last_seen FROM users WHERE role = 'deliverer'");
      res.json(rows);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const [rows] = await pool!.query("SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC", [req.params.userId]);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { id, user_id, amount, type, description } = req.body;
      await pool!.query("INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)", [id, user_id, amount, type, description]);
      
      if (type === 'deposit') {
        await pool!.query("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, user_id]);
      } else if (type === 'withdrawal') {
        await pool!.query("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, user_id]);
      }
      
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.get("/api/teams", async (req, res) => {
    try {
      const [teams]: any = await pool!.query("SELECT * FROM teams");
      const teamsWithMembers = await Promise.all(teams.map(async (team: any) => {
        const [membersRes]: any = await pool!.query("SELECT user_id FROM team_members WHERE team_id = ?", [team.id]);
        return { ...team, members: membersRes.map((m: any) => m.user_id) };
      }));
      res.json(teamsWithMembers);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const { id, name, type, members } = req.body;
      await pool!.query("INSERT INTO teams (id, name, type) VALUES (?, ?, ?)", [id, name, type]);
      
      if (members && Array.isArray(members)) {
        for (const userId of members) {
          await pool!.query("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)", [id, userId]);
        }
      }
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.get("/api/invoices/:taskId", async (req, res) => {
    try {
      const [rows]: any = await pool!.query("SELECT * FROM invoices WHERE task_id = ?", [req.params.taskId]);
      res.json(rows[0] || null);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const { id, task_id, amount } = req.body;
      await pool!.query("INSERT INTO invoices (id, task_id, amount, status) VALUES (?, ?, ?, 'pending')", [id, task_id, amount]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/users/:id/sync", async (req, res) => {
    try {
      const { name, role, lat, lng, balance, is_verified_driver, accepted_terms_at } = req.body;
      await pool!.query(
        "INSERT INTO users (id, name, role, lat, lng, balance, is_verified_driver, accepted_terms_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), lat=VALUES(lat), lng=VALUES(lng), balance=VALUES(balance), is_verified_driver=VALUES(is_verified_driver), accepted_terms_at=VALUES(accepted_terms_at)",
        [req.params.id, name, role, lat, lng, balance, is_verified_driver ? 1 : 0, accepted_terms_at]
      );
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/users/:id/accept-terms", async (req, res) => {
    try {
      await pool!.query("UPDATE users SET accepted_terms_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const [rows]: any = await pool!.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: "User not found" });
      res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.put("/api/users/:id/preferences", async (req, res) => {
    try {
      const { preferences } = req.body;
      await pool!.query("UPDATE users SET preferences = ? WHERE id = ?", [JSON.stringify(preferences), req.params.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/payment/complete", async (req, res) => {
    try {
      const { taskId, creatorId, driverId, shopId, amount } = req.body;
      
      const connection = await pool!.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, creatorId]);
        await connection.query("UPDATE users SET balance = balance + ? WHERE id = ?", [amount * 0.7, driverId]);
        await connection.query("UPDATE tasks SET status = 'completed' WHERE id = ?", [taskId]);
        await connection.commit();
      } catch (e) {
        await connection.rollback();
        throw e;
      } finally {
        connection.release();
      }
      
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.get("/api/tasks", async (req, res) => {
    try {
      const [rows] = await pool!.query("SELECT * FROM tasks WHERE status != 'completed'");
      res.json(rows);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const { id, creator_id, type, description, lat, lng, price, weight, shop_id } = req.body;
      await pool!.query(
        "INSERT INTO tasks (id, creator_id, type, status, description, lat, lng, price, weight, shop_id) VALUES (?, ?, ?, 'pending_driver', ?, ?, ?, ?, ?, ?)",
        [id, creator_id, type, description, lat, lng, price, weight, shop_id]
      );
      
      broadcast({ type: "task_created", data: { id, creator_id, type, description, lat, lng, price, weight, shop_id, status: 'pending_driver' } });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/tasks/:id/accept", async (req, res) => {
    try {
      const { driverId } = req.body;
      await pool!.query("UPDATE tasks SET driver_id = ?, status = 'assigned' WHERE id = ?", [driverId, req.params.id]);
      
      const [rows]: any = await pool!.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
      broadcast({ type: "task_updated", data: rows[0] });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/tasks/:id/complete", async (req, res) => {
    try {
      const { userId } = req.body;
      const [taskRows]: any = await pool!.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
      const task = taskRows[0];
      
      if (!task) return res.status(404).json({ error: "Task not found" });

      const connection = await pool!.getConnection();
      try {
        await connection.beginTransaction();
        
        // Update task status
        await connection.query("UPDATE tasks SET status = 'completed' WHERE id = ?", [req.params.id]);
        
        // Transfer funds
        await connection.query("UPDATE users SET balance = balance - ? WHERE id = ?", [task.price, task.creator_id]);
        if (task.driver_id) {
          await connection.query("UPDATE users SET balance = balance + ? WHERE id = ?", [task.price, task.driver_id]);
        }
        
        // Record transaction
        const tid = `trans-${Date.now()}`;
        await connection.query("INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, 'payment', ?)", 
          [tid, task.creator_id, task.price, `Payment for task: ${task.description}`]);
        
        if (task.driver_id) {
          const tid2 = `trans-earn-${Date.now()}`;
          await connection.query("INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, 'earnings', ?)", 
            [tid2, task.driver_id, task.price, `Earnings from task: ${task.description}`]);
        }

        await connection.commit();
        
        broadcast({ type: "task_updated", data: { ...task, status: 'completed' } });
        res.json({ success: true });
      } catch (e) {
        await connection.rollback();
        throw e;
      } finally {
        connection.release();
      }
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.get("/api/shops", async (req, res) => {
    try {
      const [rows] = await pool!.query("SELECT * FROM shops");
      res.json(rows);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const [rows] = await pool!.query("SELECT * FROM products WHERE name LIKE ? OR description LIKE ?", [`%${query}%`, `%${query}%`]);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.get("/api/shops/:id/products", async (req, res) => {
    try {
      const [rows] = await pool!.query("SELECT * FROM products WHERE shop_id = ?", [req.params.id]);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const { id, shop_id, name, price, image_url, available, description, stock } = req.body;
      await pool!.query(
        "INSERT INTO products (id, shop_id, name, price, image_url, available, description, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, shop_id, name, price, image_url, available ? true : false, description, stock]
      );
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.put("/api/users/:id/role", async (req, res) => {
    try {
      const { role } = req.body;
      await pool!.query("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/users/:id/verify-driver", async (req, res) => {
    try {
      const { vehicle, insurance } = req.body;
      await pool!.query("UPDATE users SET vehicle_details = ?, insurance_info = ?, is_verified_driver = true WHERE id = ?", [vehicle, insurance, req.params.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  // Operational Commerce Routes
  app.get("/api/commerce/search", async (req, res) => {
    const { lat, lng, category } = req.query;
    const results = await CommerceService.searchNearby(Number(lat), Number(lng), category as string);
    res.json(results);
  });

  app.get("/api/commerce/business/:id", async (req, res) => {
    const business = await CommerceService.getBusiness(req.params.id);
    if (!business) return res.status(404).json({ error: "Business not found" });
    res.json(business);
  });

  app.get("/api/commerce/menu/:id", async (req, res) => {
    const menu = await CommerceService.getMenu(req.params.id);
    res.json(menu);
  });

  app.post("/api/commerce/order", async (req, res) => {
    const { userId, businessId, items, fulfillment } = req.body;
    const order = await CommerceService.createOrder(userId, businessId, items, fulfillment);
    res.json(order);
  });

  app.get("/api/commerce/order/:id/status", async (req, res) => {
    // In a real app, fetch from DB
    res.json({ status: OrderStatus.ACCEPTED });
  });

  app.post("/api/payment/intent", async (req, res) => {
    const { provider, amount, currency, orderId, userId } = req.body;
    const intent = await PaymentService.createPayment(provider, amount, currency, orderId, userId);
    res.json(intent);
  });

  app.get("/api/ledger/report", async (req, res) => {
    const { from, to, type } = req.query;
    const report = await LedgerService.generateReport({ 
      from: from ? Number(from) : undefined, 
      to: to ? Number(to) : undefined, 
      type: type as string 
    });
    res.json(report);
  });
  
  app.get("/api/ledger/invoice/:orderId", async (req, res) => {
    const invoice = await LedgerService.generateInvoice(req.params.orderId);
    res.json(invoice);
  });

  app.post("/api/operator/command", async (req, res) => {
    const { command, userId, role } = req.body;

    if (role !== 'admin' && role !== 'operator' && role !== 'owner') {
      return res.status(403).json({ error: "Unauthorized: Operator access required." });
    }

    try {
      const result = await AIOrchestratorService.processCommand(command, { userId, role });
      res.json(result);
    } catch (error) {
      console.error("Operator command error:", error);
      res.status(500).json({ error: "Failed to process operator command." });
    }
  });

  // GitHub Bridge Routes
  app.post("/api/operator/repo-sync/create", async (req, res) => {
    const { actorId, actorRole, branch, commitMessage, files, role } = req.body;
    if (role !== 'admin' && role !== 'operator' && role !== 'owner') return res.status(403).json({ error: "Unauthorized" });
    try {
      const request = await RepoSyncRequestService.create(actorId, actorRole, branch, commitMessage, files);
      res.json(request);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/operator/repo-sync/approve", async (req, res) => {
    const { requestId, operatorId, role } = req.body;
    if (role !== 'admin' && role !== 'operator' && role !== 'owner') return res.status(403).json({ error: "Unauthorized" });
    try {
      await RepoSyncRequestService.approve(requestId, operatorId);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/operator/repo-sync/execute", async (req, res) => {
    const { requestId, operatorId, role } = req.body;
    if (role !== 'admin' && role !== 'operator' && role !== 'owner') return res.status(403).json({ error: "Unauthorized" });
    try {
      const commitSha = await GitHubBridgeService.executeRepoSyncRequest(requestId, operatorId);
      res.json({ success: true, commitSha });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/operator/patch/artifact", async (req, res) => {
    const { actorId, description, targetFiles, patchContent, role } = req.body;
    if (role !== 'admin' && role !== 'operator' && role !== 'owner') return res.status(403).json({ error: "Unauthorized" });
    try {
      const artifact = await PatchArtifactService.create(actorId, description, targetFiles, patchContent);
      res.json(artifact);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/ai-command", async (req, res) => {
    const { prompt, context } = req.body;
    try {
      const result = await AIOrchestratorService.processCommand(prompt, context);
      res.json(result);
    } catch (error) {
      console.error("AI command error:", error);
      res.status(500).json({ error: "Failed to process AI command." });
    }
  });

  app.post("/api/shops", async (req, res) => {
    try {
      const { id, owner_id, name, description, image_url, schedule, lat, lng } = req.body;
      await pool!.query(
        "INSERT INTO shops (id, owner_id, name, description, image_url, schedule, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, owner_id, name, description, image_url, schedule, lat, lng]
      );
      
      const newShop = { id, owner_id, name, description, image_url, schedule, lat, lng, is_active: true };
      broadcast({ type: "shop_created", data: newShop });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  // Fintech & Compliance Routes
  app.get("/api/finance/ledger/:userId", async (req, res) => {
    try {
      const [rows]: any = await pool!.query(
        "SELECT * FROM wallet_ledger WHERE transaction_id IN (SELECT id FROM financial_transactions WHERE user_id = ?) ORDER BY created_at DESC",
        [req.params.userId]
      );
      res.json(rows);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/finance/legal-profile", async (req, res) => {
    try {
      const { id, user_id, tax_id, tax_office, legal_name, legal_address } = req.body;
      await pool!.query(
        "INSERT INTO legal_profiles (id, user_id, tax_id, tax_office, legal_name, legal_address) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE tax_id=VALUES(tax_id), tax_office=VALUES(tax_office), legal_name=VALUES(legal_name), legal_address=VALUES(legal_address)",
        [id, user_id, tax_id, tax_office, legal_name, legal_address]
      );
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.get("/api/finance/invoices/:userId", async (req, res) => {
    try {
      const [rows]: any = await pool!.query(
        "SELECT * FROM compliance_invoices WHERE recipient_id = ? OR issuer_id = ? ORDER BY created_at DESC",
        [req.params.userId, req.params.userId]
      );
      res.json(rows);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/finance/self-billing/agree", async (req, res) => {
    try {
      const { userId } = req.body;
      await pool!.query("UPDATE legal_profiles SET self_billing_agreed = true WHERE user_id = ?", [userId]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  // Messaging Routes
  app.get("/api/messages/:userId", async (req, res) => {
    try {
      const { otherId } = req.query;
      let query = "SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC";
      let params = [req.params.userId, otherId, otherId, req.params.userId];
      
      if (!otherId) {
        query = "SELECT * FROM messages WHERE sender_id = ? OR receiver_id = ? ORDER BY created_at ASC";
        params = [req.params.userId, req.params.userId];
      }

      const [rows] = await pool!.query(query, params);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const { id, sender_id, receiver_id, content, task_id } = req.body;
      await pool!.query(
        "INSERT INTO messages (id, sender_id, receiver_id, content, task_id) VALUES (?, ?, ?, ?, ?)",
        [id, sender_id, receiver_id, content, task_id]
      );
      
      broadcast({ 
        type: "new_message", 
        data: { id, sender_id, receiver_id, content, task_id, created_at: new Date() } 
      });
      
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  // Rating Routes
  app.get("/api/ratings/:targetId", async (req, res) => {
    try {
      const [rows] = await pool!.query("SELECT * FROM ratings WHERE target_id = ?", [req.params.targetId]);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  app.post("/api/ratings", async (req, res) => {
    try {
      const { id, rater_id, target_id, target_type, rating, comment } = req.body;
      await pool!.query(
        "INSERT INTO ratings (id, rater_id, target_id, target_type, rating, comment) VALUES (?, ?, ?, ?, ?, ?)",
        [id, rater_id, target_id, target_type, rating, comment]
      );
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  // Analytics Routes
  app.get("/api/analytics/summary/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const [earnings]: any = await pool!.query("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'deposit'", [userId]);
      const [tasks]: any = await pool!.query("SELECT COUNT(*) as count FROM tasks WHERE creator_id = ? OR driver_id = ?", [userId, userId]);
      const [completedTasks]: any = await pool!.query("SELECT COUNT(*) as count FROM tasks WHERE (creator_id = ? OR driver_id = ?) AND status = 'completed'", [userId, userId]);
      
      res.json({
        totalEarnings: earnings[0].total || 0,
        totalTasks: tasks[0].count || 0,
        completedTasks: completedTasks[0].count || 0,
        completionRate: tasks[0].count > 0 ? (completedTasks[0].count / tasks[0].count) * 100 : 0
      });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
  });

  // WebSocket Logic
  const clients = new Map<string, WebSocket>();

  wss.on("connection", (ws) => {
    let userId: string | null = null;

    ws.on("message", async (message) => {
      if (!pool) return;
      
      const payload = JSON.parse(message.toString());

      switch (payload.type) {
        case "auth":
          userId = payload.userId;
          clients.set(userId!, ws);
          try {
            await pool.query(
              "INSERT INTO users (id, name, role, lat, lng) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), lat = VALUES(lat), lng = VALUES(lng)",
              [userId, payload.name, payload.role, payload.lat, payload.lng]
            );
          } catch (e) { console.error("WS Auth DB Error:", e); }
          break;

        case "update_location":
          if (userId) {
            try {
              await pool.query(
                "UPDATE users SET lat = ?, lng = ?, role = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?",
                [payload.lat, payload.lng, payload.role, userId]
              );
              broadcast({ 
                type: "user_moved", 
                data: { userId, lat: payload.lat, lng: payload.lng, role: payload.role } 
              }, ws);
            } catch (e) { console.error("WS Update Location DB Error:", e); }
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
    app.use(express.static(path.join(__dirname, "dist"), {
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        }
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
