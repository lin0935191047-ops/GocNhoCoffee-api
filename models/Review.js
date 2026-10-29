const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define(
  'Review',
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

    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },

    comment: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'product_id'],
      },
    ],
  },
);

module.exports = Review;
