const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define(
  'Address',
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

    recipient_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    label: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'home',
    },

    address_line: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    ward: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    district: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'addresses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
  },
);

module.exports = Address;
