require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./src/routes');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: '*', // Allow all for dev, or specify 'http://localhost:5173'
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Routes
app.use('/', routes);

// Start Server
app.listen(port, () => {
    console.log(`Local API Server running at http://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
