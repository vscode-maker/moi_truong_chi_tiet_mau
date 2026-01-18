const express = require('express');
const router = express.Router();
const sampleController = require('../controllers/sampleController');

router.post('/chi-tiet-mau/search', sampleController.search);
router.get('/chi-tiet-mau', sampleController.list);
router.get('/chi-tiet-mau/stats/all', sampleController.getStats);
router.get('/chi-tiet-mau/:id', sampleController.getDetail);
router.post('/chi-tiet-mau', sampleController.create);
router.put('/chi-tiet-mau/:id', sampleController.update);
router.post('/chi-tiet-mau-bulk/edit', sampleController.bulkUpdate);

router.delete('/api/samples/:mau_id', sampleController.deleteSample);
router.post('/api/samples/:mau_id/clone', sampleController.cloneSample);
router.post('/api/samples/:mau_id/encode', sampleController.encodeSample);

module.exports = router;
