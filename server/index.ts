import express, { Request, Response } from 'express';
import cors from 'cors';
import { CONFIG } from './config.js';
import { db } from './db/database.js';
import { agentService } from './services/agentService.js';
import { ChatRequest } from './types.js';

const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    botName: CONFIG.BOT_NAME,
    store: CONFIG.STORE_NAME,
    engine: '100% Deterministic Rule-Based Precision Engine (Zero-AI / Zero-Latency)',
    timestamp: new Date().toISOString(),
  });
});

// Main conversational chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const chatRequest: ChatRequest = req.body;
    if (!chatRequest.messages || !Array.isArray(chatRequest.messages)) {
      return res.status(400).json({ error: 'Invalid request: "messages" array is required' });
    }

    const response = await agentService.processChat(chatRequest);
    return res.json(response);
  } catch (error) {
    console.error('Error processing chat:', error);
    return res.status(500).json({
      error: 'Internal server error processing chat request',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Orders endpoint
app.get('/api/orders', (req: Request, res: Response) => {
  res.json({ orders: db.getAllOrders() });
});

// Products catalog endpoint
app.get('/api/products', (req: Request, res: Response) => {
  res.json({ products: db.getAllProducts() });
});

// Policy endpoints
app.get('/api/policies/return', (req: Request, res: Response) => {
  res.json({ returnPolicy: db.getReturnPolicy() });
});

app.get('/api/policies/shipping', (req: Request, res: Response) => {
  res.json({ shippingPolicy: db.getShippingPolicy() });
});

// Live Agent tickets endpoint
app.get('/api/tickets', (req: Request, res: Response) => {
  res.json({ tickets: db.getAllTickets() });
});

// Reset mock DB
app.post('/api/reset-db', (req: Request, res: Response) => {
  db.reset();
  res.json({ success: true, message: 'Database reset to initial state' });
});

app.listen(CONFIG.PORT, () => {
  console.log(`====================================================`);
  console.log(`🧭  ${CONFIG.BOT_NAME} Server Running`);
  console.log(`📡  Port: http://localhost:${CONFIG.PORT}`);
  console.log(`⚡  Mode: 100% Rule-Based & Instant (No External API Keys Required)`);
  console.log(`====================================================`);
});
