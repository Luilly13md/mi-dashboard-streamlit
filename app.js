const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// --- Helper function to read products from file ---
function readProductsFromFile(callback) {
  fs.readFile('products.json', 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') { // File not found
        return callback(null, []); // Return empty array if file doesn't exist
      }
      return callback(err); // Other read errors
    }
    try {
      const products = JSON.parse(data);
      return callback(null, products);
    } catch (parseError) {
      return callback(parseError); // JSON parsing error
    }
  });
}

// --- Helper function to write products to file ---
function writeProductsToFile(products, callback) {
  fs.writeFile('products.json', JSON.stringify(products, null, 2), 'utf8', (err) => {
    if (err) {
      return callback(err);
    }
    return callback(null);
  });
}

// --- GET /products endpoint ---
app.get('/products', (req, res, next) => {
  readProductsFromFile((err, products) => {
    if (err) {
      // Log the error for server-side inspection
      console.error("Error reading products.json:", err);
      // For ENOENT, we decided to return empty array, but other errors are 500
      if (err.code !== 'ENOENT') {
        return next(err); // Pass to generic error handler
      }
    }
    res.json(products || []); // Send empty array if products is null/undefined (e.g. file was empty)
  });
});

// --- POST /products endpoint ---
app.post('/products', (req, res, next) => {
  const { name, price, quantity } = req.body;

  // --- Validation ---
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Invalid product name. Name must be a non-empty string.' });
  }
  if (price === undefined || typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ message: 'Invalid product price. Price must be a positive number.' });
  }
  if (quantity === undefined || typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
    return res.status(400).json({ message: 'Invalid product quantity. Quantity must be a non-negative integer.' });
  }

  readProductsFromFile((err, products) => {
    if (err && err.code !== 'ENOENT') { // Allow ENOENT to proceed, will create new file
        console.error("Error reading products.json for POST:", err);
        return next(err);
    }
    
    products = products || []; // Initialize if file was not found or empty

    // --- Generate new product ID ---
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

    const newProduct = {
      id: newId,
      name: name.trim(),
      price,
      quantity
    };

    products.push(newProduct);

    writeProductsToFile(products, (writeErr) => {
      if (writeErr) {
        console.error("Error writing products.json:", writeErr);
        return next(writeErr);
      }
      res.status(201).json(newProduct);
    });
  });
});

// --- Generic Error Handler ---
// This should be defined after all other app.use() and routes calls
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err.message || err); // Log the error stack for debugging
  res.status(500).json({ message: 'Internal Server Error' });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // Export for potential testing
