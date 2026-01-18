const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/create-full', orderController.createFullOrder);
router.get('/generate-id', orderController.generateOrderId);
router.get('/next-id', orderController.generateNextId);
router.get('/stats', orderController.getOrderStats);
router.get('/full/:id', orderController.getFullOrder);
router.get('/:id', orderController.getOrderById);
router.put('/full/:id', orderController.updateFullOrder);

// Exposed via CRUD path in original, keeping consistent path mapping in index router if possible, or mapping here.
// Original was DELETE /cefinea/api/crud/don_hang/:id
// We will export this route and map it appropriately in the main router or keep a clean path here.
router.delete('/:id', orderController.deleteOrderCascading);

module.exports = router;
