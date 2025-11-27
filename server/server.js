const express = require('express');
const cors = require('cors');
const path = require('path');
const kycRouter = require('./kyc-api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - serve uploaded documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/kyc', kycRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Ionova KYC API',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'Ionova KYC API Server',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            kyc: '/api/kyc/*'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Ionova KYC API Server running on port ${PORT}`);
    console.log(`📝 API Documentation: http://localhost:${PORT}`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
