const { Op } = require('sequelize');
const { Category } = require('../models');

// GET /api/categories
// Lấy tất cả danh mục
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách danh mục',
    });
  }
};

// GET /api/categories/:id
// Chi tiết danh mục
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Get category detail error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin danh mục',
    });
  }
};

// POST /api/categories
// Tạo danh mục
// Chỉ Admin
const createCategory = async (req, res) => {
  try {
    const { name, slug, description, image } = req.body;

    // Kiểm tra name
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục là bắt buộc',
      });
    }

    // Kiểm tra slug
    if (!slug || !slug.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Slug là bắt buộc',
      });
    }

    // Kiểm tra slug trùng
    const existingCategory = await Category.findOne({
      where: {
        [Op.or]: [
          {
            name: name.trim(),
          },
          {
            slug: slug.trim(),
          },
        ],
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Tên hoặc slug danh mục đã tồn tại',
      });
    }

    const category = await Category.create({
      name: name.trim(),
      slug: slug.trim(),
      description,
      image,
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: category,
    });
  } catch (error) {
    console.error('Create category error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể tạo danh mục',
      error: error.message,
    });
  }
};

// PUT /api/categories/:id
// Cập nhật danh mục
// Chỉ Admin
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
    }

    const { name, slug, description, image } = req.body;

    // Kiểm tra name trùng
    if (name !== undefined) {
      const existingName = await Category.findOne({
        where: {
          name: name.trim(),
          id: {
            [Op.ne]: id,
          },
        },
      });

      if (existingName) {
        return res.status(409).json({
          success: false,
          message: 'Tên danh mục đã tồn tại',
        });
      }
    }
    // Kiểm tra slug trùng
    if (slug !== undefined) {
      const existingSlug = await Category.findOne({
        where: {
          slug: slug.trim(),
          id: {
            [Op.ne]: id,
          },
        },
      });

      if (existingSlug) {
        return res.status(409).json({
          success: false,
          message: 'Slug danh mục đã tồn tại',
        });
      }
    }

    // Update
    await category.update({
      ...(name !== undefined && {
        name: name.trim(),
      }),

      ...(slug !== undefined && {
        slug: slug.trim(),
      }),

      ...(description !== undefined && {
        description,
      }),

      ...(image !== undefined && {
        image,
      }),
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: category,
    });
  } catch (error) {
    console.error('Update category error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật danh mục',
      error: error.message,
    });
  }
};

// DELETE /api/categories/:id
// Xóa danh mục
// Chỉ Admin
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
    }

    // Kiểm tra sản phẩm thuộc category
    const { Product } = require('../models');

    const productCount = await Product.count({
      where: {
        category_id: id,
      },
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa danh mục đang có sản phẩm',
      });
    }

    await category.destroy();

    return res.status(200).json({
      success: true,
      message: 'Đã xóa danh mục',
    });
  } catch (error) {
    console.error('Delete category error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể xóa danh mục',
      error: error.message,
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
