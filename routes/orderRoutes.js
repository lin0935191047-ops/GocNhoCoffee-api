const express = require('express');

const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getMyOrderRoute,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  updateShipperLocation,
} = require('../controllers/orderController');

const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// ADMIN

router.get('/admin', authMiddleware, adminOnly, getAllOrders);

router.get('/admin/:id', authMiddleware, adminOnly, getAdminOrderById);

router.put('/admin/:id/status', authMiddleware, adminOnly, updateOrderStatus);

router.put(
  '/admin/:id/location',
  authMiddleware,
  adminOnly,
  updateShipperLocation,
);

// USER

router.post('/', authMiddleware, createOrder);

router.get('/', authMiddleware, getMyOrders);

router.get('/:id/route', authMiddleware, getMyOrderRoute);

router.get('/:id', authMiddleware, getMyOrderById);

module.exports = router;
