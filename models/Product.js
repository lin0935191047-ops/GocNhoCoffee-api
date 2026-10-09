const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
    },

    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    old_price: {
      type: DataTypes.DECIMAL(12, 2),
    },

    image: {
      type: DataTypes.TEXT,
    },

    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    sold: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    rating: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0,
    },

    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
    },
  },
  {
    tableName: 'products',

    // Sequelize tự quản lý created_at và updated_at
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
  },
);

module.exports = Product;
