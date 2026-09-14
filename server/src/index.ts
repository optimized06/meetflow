import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import meetingsRouter from './routes/meetings.js';
import { handleSignaling } from './socket/signaling.js';
import './lib/supabase.js';

dotenv.config();

const port = process.env.PORT || 3001;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

app.use(cors({
  origin: clientUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/meetings', meetingsRouter);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'MeetFlow API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      meetings: '/api/meetings',
    },
    frontend: clientUrl,
  });
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST']
  }
});

handleSignaling(io);

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Allowed client URL: ${clientUrl}`);
});
