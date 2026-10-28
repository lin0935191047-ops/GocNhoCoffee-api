const express = require('express');

const router = express.Router();

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// GET /api/categories
// Public
router.get('/', getCategories);

// GET /api/categories/:id
// Public
router.get('/:id', getCategoryById);

// POST /api/categories
// Admin only
router.post('/', authMiddleware, adminOnly, createCategory);

// PUT /api/categories/:id
// Admin only
router.put('/:id', authMiddleware, adminOnly, updateCategory);

// DELETE /api/categories/:id
// Admin only
router.delete('/:id', authMiddleware, adminOnly, deleteCategory);

module.exports = router;
