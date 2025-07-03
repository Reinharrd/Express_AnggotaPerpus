const express = require('express');
// const http = require('http');
const cors = require('cors');
// const { Server } = require('socket.io');
// const fs = require('fs');
// const https = require('https');

// const privateKey = fs.readFileSync('./ssl/server.key', 'utf8');
// const certificate = fs.readFileSync('./ssl/server.cert', 'utf8');
// const credentials = { key: privateKey, cert: certificate };

const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: '*',
//         methods: ['GET', 'POST']
//     }
// });
const port = 3000;

// app.set('socketio', io);

app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Requested-With']
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const authRoutes = require('./modules/api/routes/route');
app.use('/api', authRoutes)

app.get('/', (req, res) => {
    res.send('Hello World!')
});

// io.on('connection', (socket) => {
//     console.log('🔌 Socket connected:', socket.id);

//     socket.on('join_user_room', (userId) => {
//         socket.join(`user_${userId}`);
//         console.log(`🧑 User ${userId} joined room: user_${userId}`);
//     });

//     socket.on('disconnect', () => {
//         console.log('❌ Socket disconnected:', socket.id);
//     });
// });

app.listen(port, '0.0.0.0', () => {
    console.log(`Example app listening on port ${port}`)
})

// https.createServer(credentials, app).listen(port, '0.0.0.0', () => {
//     console.log(`HTTPS Server running at https://10.1.28.105:${port}`);
// });