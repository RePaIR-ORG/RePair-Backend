import './env.js';  // Must be first — loads .env before any other module reads process.env
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import studentAuthRoutes from './routes/studentAuth.js';
import specialistRoutes from './routes/specialist.js';

const app = express();

// Middleware
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const specialKidUrl = process.env.SPECIALKID_URL || 'http://localhost:3000';
app.use(cors({
  origin: [frontendUrl, specialKidUrl],
  credentials: true,
}));
app.use(express.json());

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/repair';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/student-auth', studentAuthRoutes);
app.use('/api/specialist', specialistRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('RePair Backend is running!');
});
