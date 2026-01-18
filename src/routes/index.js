const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const sampleRoutes = require('./sampleRoutes');
const orderRoutes = require('./orderRoutes');
const commonRoutes = require('./commonRoutes');

// Mount routes
// Note: legacy paths were like /cefinea/api/auth/login or /cefinea/chi-tiet-mau
// server.js mounted explicit paths.
// We serve all under /cefinea/api/ or something?
// Original server.js:
// app.post('/cefinea/api/auth/login', ...)
// app.post('/cefinea/chi-tiet-mau/search', ...)
//
// To match exact paths without changing frontend, we need to be careful with mounting.
// Best approach: Mount this router at `/` and define full paths in sub-routers OR 
// mount sub-routers at specific prefixes, but paths are inconsistent.
//
// Auth: /cefinea/api/auth
// Sample: /cefinea/chi-tiet-mau AND /cefinea/api/samples
// Order: /cefinea/api/orders
// Common: /cefinea/api/crud AND /cefinea/api/so-phieu-kq

// Auth
router.use('/cefinea/api/auth', authRoutes);

// Samples (Mixed paths)
// sampleRoutes has /chi-tiet-mau... and /api/samples...
// If we mount sampleRoutes at /cefinea, then:
// /chi-tiet-mau/search -> /cefinea/chi-tiet-mau/search (Matches)
// /api/samples/:id -> /cefinea/api/samples/:id (Matches)
router.use('/cefinea', sampleRoutes);

// Orders
router.use('/cefinea/api/orders', orderRoutes);

// Common
// commonRoutes has /crud... and /so-phieu-kq...
// Mount at /cefinea/api
router.use('/cefinea/api', commonRoutes);

module.exports = router;
