const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');

const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const contactRoutes = require('./routes/contactRoutes');
const addressRoutes = require('./routes/addressRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// ==========================
// ROUTES
// ==========================
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/addresses', addressRoutes);

// ==========================
// HOME
// ==========================
app.get('/', (req, res) => {
  res.json({
    message: 'GocNhoCoffee API is running!',
  });
});

// ==========================
// HEALTH CHECK
// ==========================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
  });
});

// ==========================
// SERVER
// ==========================
const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log('PostgreSQL connected successfully!');

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:');
    console.error(error.message);
  }
}

startServer();
