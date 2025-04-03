const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(express.json());

// Load initial catalog data
let catalog = require('./catalog.json');

// Helper function to save catalog to file
function saveCatalog() {
    fs.writeFileSync(path.join(__dirname, 'catalog.json'), JSON.stringify(catalog, null, 2));
}

// Query by subject
app.get('/search/:topic', (req, res) => {
    const topic = req.params.topic;
    const matchingBooks = catalog.books.filter(book => 
        book.topic.toLowerCase() === topic.toLowerCase()
    ).map(book => ({
        id: book.id,
        title: book.title
    }));
    
    res.json(matchingBooks);
});

// Query by item
app.get('/info/:item_number', (req, res) => {
    const itemNumber = parseInt(req.params.item_number);
    const book = catalog.books.find(b => b.id === itemNumber);
    
    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json({
        title: book.title,
        quantity: book.quantity,
        price: book.price
    });
});

// Update item
app.put('/update/:item_number', (req, res) => {
    const itemNumber = parseInt(req.params.item_number);
    const { price, quantity } = req.body;
    const bookIndex = catalog.books.findIndex(b => b.id === itemNumber);
    
    if (bookIndex === -1) {
        return res.status(404).json({ error: 'Book not found' });
    }
    
    if (price !== undefined) {
        catalog.books[bookIndex].price = price;
    }
    
    if (quantity !== undefined) {
        catalog.books[bookIndex].quantity = quantity;
    }
    
    saveCatalog();
    res.json({ success: true, book: catalog.books[bookIndex] });
});

app.listen(PORT, () => {
    console.log(`Catalog service running on port ${PORT}`);
});