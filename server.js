require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
// Allow requests from your local React app AND your future live React app
app.use(cors({
  origin: [
    'https://avskexim.com',
    'https://avskexim.com/',
    'https://www.avskexim.com', 
    'https://www.avskexim.com/',
    'https://website-avskexim-admin-page.vercel.app', // Add your live frontend URL later
  ],
  methods: ['GET', 'POST', 'PUT','PATCH'],
  credentials: true
}));

app.use(express.json());

// ==========================================
// DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ==========================================
// SCHEMA & MODEL
// ==========================================
const productSchema = new mongoose.Schema({
  productName: { type: String, required: true, unique: true },
  hsCode: { type: String },
  description: { type: String },
  rate: { type: String },
  availability: { type: String, enum: ['Available', 'Unavailable'], default: 'Available' }
});

const Product = mongoose.model('Product', productSchema);

// ==========================================
// ROUTES
// ==========================================

// 1. GET: Check if product exists (Search by name OR HS Code)
app.get('/api/products', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.json(null);

    // Search by product name (case-insensitive) OR exact HS Code
    const product = await Product.findOne({ 
      $or: [
        { productName: { $regex: new RegExp(`^${name}$`, 'i') } },
        { hsCode: name }
      ]
    });

    if (product) {
      res.json({
        id: product._id,
        productName: product.productName,
        hsCode: product.hsCode,
        description: product.description,
        rate: product.rate,
        availability: product.availability
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during search" });
  }
});

// 2. POST: Insert new product
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json({ message: "Product Created", product: newProduct });
  } catch (error) {
    res.status(400).json({ message: "Error creating product", error: error.message });
  }
});

// 3. PUT: Update existing product
app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedProduct = await Product.findByIdAndUpdate(
        productId, 
        req.body, 
        { new: true } 
    );
    res.status(200).json({ message: "Product Updated", product: updatedProduct });
  } catch (error) {
    res.status(400).json({ message: "Error updating product", error: error.message });
  }
});

// ==========================================
// START SERVER
// ==========================================
// Cloud hosts (like Render) assign a PORT dynamically via process.env.PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});