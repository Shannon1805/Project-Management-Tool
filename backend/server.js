import express from "express";
import http from "http"; // <- needed for socket.io
import { Server } from "socket.io"; // <- socket.io server
import api from './routes/index.js';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();

// ----------------- Mongoose -----------------
mongoose.connect(process.env.MONGODB_PATH, () => {
    console.log('MongoDB connected');
}, (e) => console.log(e));

// ----------------- App & Server -----------------
const app = express();
const server = http.createServer(app); // <- use this server for socket.io

// ----------------- CORS & Middleware -----------------
const PORT = process.env.SERVER_PORT || 9000;
const origin = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------- Routes -----------------
app.use(api);

// ----------------- Socket.IO Setup -----------------
const io = new Server(server, {
    cors: { origin } // allow frontend connection
});

// make io accessible in routes
app.set('io', io);

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// ----------------- Start Server -----------------
server.listen(PORT, () => {
    console.log(`Your app is running at http://localhost:${PORT}`);
});
