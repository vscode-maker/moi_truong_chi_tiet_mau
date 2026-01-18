const express = require('express');
const router = express.Router();
const commonController = require('../controllers/commonController');
const orderController = require('../controllers/orderController'); // For specific Delete override

// Specific API for Sequence
router.get('/so-phieu-kq/max-sequence', commonController.getMaxSequence);

// Generic CRUD
router.get('/crud/distinct/:table/:column', commonController.sanitizeTable, commonController.getDistinctValues);
router.get('/crud/:table', commonController.sanitizeTable, commonController.genericList);
router.post('/crud/:table', commonController.sanitizeTable, commonController.genericCreate);
router.put('/crud/:table/:id', commonController.sanitizeTable, commonController.genericUpdate);
router.delete('/crud/:table/:id', commonController.sanitizeTable, commonController.genericDelete);

// Specific Delete override for don_hang within crud path (from legacy structure)
// NOTE: express matches top-down. We need this BEFORE generic :table/:id route if we want to intercept, 
// BUT :table is a param. So `/crud/don_hang/:id` matches `/crud/:table/:id`.
// To handle this, we can register specific route first.
router.delete('/crud/don_hang/:id', orderController.deleteOrderCascading);

module.exports = router;
