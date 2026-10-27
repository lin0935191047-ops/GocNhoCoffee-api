const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'pending',
    },

    payment_method: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'cod',
    },

    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    shipper_latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },

    shipper_longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },

    shipper_location_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
  },
);

module.exports = Order;