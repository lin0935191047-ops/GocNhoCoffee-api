const { Op } = require('sequelize');
const {
  Order,
  OrderItem,
  Product,
  User,
} = require('../models');

// =========================
// TẠO ĐƠN HÀNG
// =========================

const createOrder = async (req, res) => {
  let transaction;

  try {
    transaction = await Order.sequelize.transaction();

    const userId = req.user.id;

    const {
      items,
      shipping_address,
      phone,
      payment_method = 'cod',
      note,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng đang trống',
      });
    }

    if (
      typeof shipping_address !== 'string' ||
      !shipping_address.trim() ||
      typeof phone !== 'string' ||
      !phone.trim()
    ) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ địa chỉ và số điện thoại',
      });
    }

    const allowedPaymentMethods = ['cod', 'banking'];

    if (!allowedPaymentMethods.includes(payment_method)) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không hợp lệ',
      });
    }

    const quantitiesByProductId = new Map();

    for (const item of items) {
      const productId = Number(item?.product_id);
      const quantity = Number(item?.quantity);

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: 'Sản phẩm hoặc số lượng không hợp lệ',
        });
      }

      quantitiesByProductId.set(
        productId,
        (quantitiesByProductId.get(productId) || 0) + quantity,
      );
    }

    const productIds = [...quantitiesByProductId.keys()];

    const products = await Product.findAll({
      where: {
        id: {
          [Op.in]: productIds,
        },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (products.length !== productIds.length) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: 'Một hoặc nhiều sản phẩm không tồn tại',
      });
    }

    let totalPriceInCents = 0;

    const orderItems = [];
    const productsById = new Map(
      products.map((product) => [Number(product.id), product]),
    );

    for (const [productId, quantity] of quantitiesByProductId) {
      const product = productsById.get(productId);

      if (Number(product.stock) < quantity) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" không đủ số lượng`,
        });
      }

      const priceInCents = Math.round(Number(product.price) * 100);
      const subtotalInCents = priceInCents * quantity;

      if (
        !Number.isSafeInteger(priceInCents) ||
        priceInCents < 0 ||
        !Number.isSafeInteger(subtotalInCents) ||
        !Number.isSafeInteger(totalPriceInCents + subtotalInCents)
      ) {
        await transaction.rollback();

        return res.status(500).json({
          success: false,
          message: 'Giá sản phẩm không hợp lệ',
        });
      }

      totalPriceInCents += subtotalInCents;

      orderItems.push({
        product_id: product.id,
        quantity,
        price: priceInCents / 100,
        subtotal: subtotalInCents / 100,
      });
    }

    const totalPrice = totalPriceInCents / 100;
    const order = await Order.create(
      {
        user_id: userId,
        total_price: totalPrice,
        status: 'pending',
        payment_method,
        shipping_address: shipping_address.trim(),
        phone: phone.trim(),
        note: typeof note === 'string' ? note.trim() || null : null,
      },
      {
        transaction,
      },
    );

    for (const item of orderItems) {
      await OrderItem.create(
        {
          order_id: order.id,
          ...item,
        },
        {
          transaction,
        },
      );

      const product = productsById.get(item.product_id);

      await product.update(
        {
          stock: Number(product.stock) - item.quantity,
          sold: Number(product.sold || 0) + item.quantity,
        },
        {
          transaction,
        },
      );
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: {
        order_id: order.id,
        id: order.id,
        total_price: totalPrice,
        status: order.status,
      },
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Create order rollback error:', rollbackError);
      }
    }

    console.error('Create order error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể tạo đơn hàng',
    });
  }
};

// =========================
// LẤY DANH SÁCH ĐƠN HÀNG CỦA USER
// =========================

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: {
        user_id: userId,
      },

      include: [
        {
          model: OrderItem,
          as: 'items',

          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'slug', 'price', 'image'],
            },
          ],
        },
      ],

      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get my orders error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách đơn hàng',
    });
  }
};

// =========================
// XEM CHI TIẾT ĐƠN HÀNG
// =========================

const getMyOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ',
      });
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        user_id: userId,
      },

      include: [
        {
          model: OrderItem,
          as: 'items',

          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'slug', 'price', 'image'],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get my order detail error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy chi tiết đơn hàng',
    });
  }
};

// =========================
// ADMIN - LẤY TẤT CẢ ĐƠN HÀNG
// =========================

const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    const orders = await Order.findAll({
      where,

      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone'],
        },

        {
          model: OrderItem,
          as: 'items',

          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'slug', 'price', 'image'],
            },
          ],
        },
      ],

      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get all orders error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách đơn hàng',
    });
  }
};

// =========================
// ADMIN - CHI TIẾT ĐƠN HÀNG
// =========================

const getAdminOrderById = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ',
      });
    }

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'slug', 'price', 'image'],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get admin order detail error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy chi tiết đơn hàng',
    });
  }
};

// =========================
// ADMIN - CẬP NHẬT TRẠNG THÁI
// =========================

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ',
      });
    }

    const allowedStatuses = [
      'pending',
      'confirmed',
      'shipping',
      'completed',
      'cancelled',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái đơn hàng không hợp lệ',
      });
    }

    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    order.status = status;

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order,
    });
  } catch (error) {
    console.error('Update order status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái đơn hàng',
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
};
