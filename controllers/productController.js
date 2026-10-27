const { Op } = require('sequelize');
const { Product, Category } = require('../models');

const PRODUCT_FIELDS = [
  'category_id',
  'name',
  'slug',
  'description',
  'price',
  'old_price',
  'image',
  'stock',
  'sold',
  'rating',
  'status',
];

const pickProductFields = (body = {}) =>
  Object.fromEntries(
    PRODUCT_FIELDS.filter((field) => body[field] !== undefined).map((field) => [
      field,
      body[field],
    ]),
  );

//  GET /api/products
// Lấy danh sách sản phẩm
// + tìm kiếm
// + lọc category
// + phân trang
const getProducts = async (req, res) => {
  try {
    const { search = '', category, page = 1, limit = 8 } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const itemsPerPage = Math.max(Number(limit) || 8, 1);

    const offset = (currentPage - 1) * itemsPerPage;

    const whereCondition = {};

    // Tìm kiếm theo tên sản phẩm
    if (search.trim()) {
      whereCondition.name = {
        [Op.iLike]: `%${search.trim()}%`,
      };
    }

    //  Lọc theo category
    if (category) {
      const categoryId = Number(category);

      if (!Number.isInteger(categoryId)) {
        return res.status(400).json({
          success: false,
          message: 'category không hợp lệ',
        });
      }

      whereCondition.category_id = categoryId;
    }

    // Lấy dữ liệu
    const { count, rows } = await Product.findAndCountAll({
      where: whereCondition,

      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug'],
        },
      ],

      order: [['id', 'ASC']],

      limit: itemsPerPage,
      offset,
    });

    const totalPages = Math.ceil(count / itemsPerPage);

    return res.status(200).json({
      success: true,

      data: rows,

      pagination: {
        page: currentPage,
        limit: itemsPerPage,
        total: count,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách sản phẩm',
    });
  }
};

// GET /api/products/:id
// Chi tiết sản phẩm
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Get product detail error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin sản phẩm',
    });
  }
};

// POST /api/products
// Tạo sản phẩm
const createProduct = async (req, res) => {
  try {
    const productData = pickProductFields(req.body);

    // Kiểm tra category
    if (!productData.category_id) {
      return res.status(400).json({
        success: false,
        message: 'category_id là bắt buộc',
      });
    }

    const category = await Category.findByPk(productData.category_id);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Danh mục không tồn tại',
      });
    }

    // Kiểm tra slug trùng
    if (productData.slug) {
      const existingProduct = await Product.findOne({
        where: {
          slug: productData.slug,
        },
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Slug sản phẩm đã tồn tại',
        });
      }
    }

    // Tạo sản phẩm
    // Sequelize tự tạo:
    // created_at
    // updated_at
    const product = await Product.create(productData);

    return res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể tạo sản phẩm',
      error: error.message,
    });
  }
};

// PUT /api/products/:id
// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    const productData = pickProductFields(req.body);

    // Nếu cập nhật category
    if (productData.category_id !== undefined) {
      const category = await Category.findByPk(productData.category_id);

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Danh mục không tồn tại',
        });
      }
    }

    // Nếu cập nhật slug
    if (productData.slug !== undefined) {
      const existingProduct = await Product.findOne({
        where: {
          slug: productData.slug,

          // Không kiểm tra chính sản phẩm đang update
          id: {
            [Op.ne]: id,
          },
        },
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Slug sản phẩm đã tồn tại',
        });
      }
    }

    // Update
    // Sequelize tự cập nhật:
    // updated_at
    await product.update(productData);

    // Lấy lại product kèm Category
    const updatedProduct = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: updatedProduct,
    });
  } catch (error) {
    console.error('Update product error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật sản phẩm',
      error: error.message,
    });
  }
};

// DELETE /api/products/:id
// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    await product.destroy();

    return res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm',
    });
  } catch (error) {
    console.error('Delete product error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể xóa sản phẩm',
      error: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
