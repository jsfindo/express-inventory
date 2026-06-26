const express = require('express');
const path = require('path');
const db = require('./db'); // Database pool connector helper (db/index.js)
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set Up Views Engine Configuration
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Parsing Middleware (Order matters!)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Automatically redirect Home URL straight to the catalog page
app.get('/', (req, res) => res.redirect('/products'));

// ==========================================
// PAGE 1: PRODUCT CATALOG (WITH CATEGORY FILTERING)
// ==========================================
app.get('/products', async (req, res) => {
  try {
    // 1. Capture the query parameter "?cat=ID" from the URL
    const selectedCategory = req.query.cat;

    let productsQuery = `
      SELECT p.id, p.name, p.price, p.stock_quantity, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    let queryParams = [];

    // 2. If a specific category filter is requested, inject the WHERE clause
    if (selectedCategory && selectedCategory !== "") {
      productsQuery += ` WHERE p.category_id = $1`;
      queryParams.push(selectedCategory); // Secure parameterized inputs
    }

    productsQuery += ` ORDER BY p.id DESC`;

    // 3. Run both queries (Products and full Categories list for the dropdown)
    const productsResult = await db.query(productsQuery, queryParams);
    const categoriesResult = await db.query('SELECT id, name FROM categories ORDER BY name ASC');
    
    // 4. Render products.ejs and pass ALL variables required by the view
    res.render('products', { 
      productsList: productsResult.rows,
      categoriesList: categoriesResult.rows,
      currentCategory: selectedCategory || "" // Sends current active filter back to EJS
    });

  } catch (err) {
    console.error('Catalog Route Error:', err.message);
    res.status(500).send('Error loading the catalog view engine');
  }
});

// ==========================================
// PAGE 2: CREATE PRODUCT FORM & SUBMIT ACTION
// ==========================================
// Render the creation view
app.get('/products/new', async (req, res) => {
  try {
    const categoriesResult = await db.query('SELECT id, name FROM categories ORDER BY name ASC');
    res.render('new-product', { categoriesList: categoriesResult.rows });
  } catch (err) {
    console.error('New Product View Error:', err.message);
    res.status(500).send('Error loading product creation form options');
  }
});

// Catch form payload and insert to database
app.post('/products', async (req, res) => {
  try {
    const { name, price, stock_quantity, category_id } = req.body;
    const queryText = `
      INSERT INTO products (name, price, stock_quantity, category_id) 
      VALUES ($1, $2, $3, $4)
    `;
    
    // Safely assign null if the category selection field is submitted blank
    await db.query(queryText, [name, price, stock_quantity, category_id || null]);
    
    res.redirect('/products');
  } catch (err) {
    console.error('Save Product Error:', err.message);
    res.status(500).send('Error saving the product to the relational database structure');
  }
});

// ==========================================
// EDIT PRODUCT PAGE (GET THE DATA)
// ==========================================
app.get('/products/:id/edit', async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. Fetch the specific product's current values
    const productResult = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).send('Product not found');
    }

    // 2. Fetch all categories so the dropdown options exist
    const categoriesResult = await db.query('SELECT id, name FROM categories ORDER BY name ASC');

    // 3. Render the form and pass both items
    res.render('edit-product', {
      product: productResult.rows[0],
      categoriesList: categoriesResult.rows
    });
    
  } catch (err) {
    console.error('Error loading edit view:', err.message);
    res.status(500).send('Server Error fetching item configurations');
  }
});

// ==========================================
// UPDATE PRODUCT ACTION (SAVE CHANGES)
// ==========================================
app.post('/products/:id/update', async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, price, stock_quantity, category_id } = req.body;

    const queryText = `
      UPDATE products 
      SET name = $1, price = $2, stock_quantity = $3, category_id = $4 
      WHERE id = $5
    `;

    await db.query(queryText, [name, price, stock_quantity, category_id || null, productId]);

    // Send user back to catalog to see their updated changes
    res.redirect('/products');
  } catch (err) {
    console.error('Update Product Error:', err.message);
    res.status(500).send('Error saving modifications back to the table structure');
  }
});

// ==========================================
// PAGE 3: CREATE CATEGORY FORM & SUBMIT ACTION
// ==========================================
// Render the view
app.get('/categories/new', (req, res) => {
  res.render('new-category');
});

// Catch form payload and insert to database
app.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    const queryText = 'INSERT INTO categories (name, description) VALUES ($1, $2)';
    
    await db.query(queryText, [name, description || null]);
    
    // Forward the user straight to the product creation page to see their new category option
    res.redirect('/products/new');
  } catch (err) {
    console.error('Save Category Error:', err.message);
    res.status(500).send('Error saving the category. Make sure it has a completely unique name.');
  }
});

app.post('/products/:id/delete', async (req, res) => {
  try {
    const productId = req.params.id;

    // Execute the SQL DELETE statement targeting the specific matching primary key ID
    await db.query('DELETE FROM products WHERE id = $1', [productId]);

    // Send the user directly back to the catalog list page to see the updated item list
    res.redirect('/products');
  } catch (err) {
    console.error('Delete Product Error:', err.message);
    res.status(500).send('Error occurred while attempting to remove product from the table');
  }
});

// Start application runtime engine instance
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Inventory System Context Live!`);
  console.log(`   🔗 View Full Catalog: http://localhost:${PORT}/products`);
  console.log(`====================================================`);
});