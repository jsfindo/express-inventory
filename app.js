const express = require('express'); // Import Express
const app = express();              // Initialize the app instance
const PORT = 3000;                  // Define your server port


// Set the directory where your template files live
app.set('views', './views');

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Define a basic GET route for the homepage
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server and listen for requests
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
