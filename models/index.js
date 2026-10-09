const sequelize = require('../config/database');

const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');
const ContactMessage = require('./ContactMessage');
const Address = require('./Address');

// =========================
// CATEGORY - PRODUCT
// =========================
Category.hasMany(Product, {
  foreignKey: 'category_id',
});

Product.belongsTo(Category, {
  foreignKey: 'category_id',
});

// =========================
// USER - ORDER
// =========================
User.hasMany(Order, {
  foreignKey: 'user_id',
});

User.hasMany(Address, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

Address.belongsTo(User, {
  foreignKey: 'user_id',
});

Order.belongsTo(User, {
  foreignKey: 'user_id',
});

// =========================
// ORDER - ORDER ITEM
// =========================
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items',
  onDelete: 'CASCADE',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
});

// =========================
// PRODUCT - ORDER ITEM
// =========================
Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
});

OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
});

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  Order,
  OrderItem,
  Review,
  ContactMessage,
  Address,
};
