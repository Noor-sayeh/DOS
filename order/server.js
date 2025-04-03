const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;
const CATALOG_SERVICE_URL = 'http://localhost:3001';

app.use(express.json());

// Load initial orders data
let orders = { orders: [] };
const ordersFile = path.join(__dirname, 'orders.json');

if (fs.existsSync(ordersFile)) {
    orders = require(ordersFile);
}

// Helper function to save orders to file
function saveOrders() {
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

// Purchase item
app.post('/purchase/:item_number', async (req, res) => {
    const itemNumber = parseInt(req.params.item_number);
    
    try {
        // First check if item is in stock
        const response = await axios.get(`${CATALOG_SERVICE_URL}/info/${itemNumber}`);
        const book = response.data;
        
        if (book.quantity <= 0) {
            return res.status(400).json({ error: 'Item out of stock' });
        }
        
        // Decrement quantity in catalog
        await axios.put(`${CATALOG_SERVICE_URL}/update/${itemNumber}`, {
            quantity: book.quantity - 1
        });
        
        // Record the order
        const newOrder = {
            id: orders.orders.length + 1,
            item_number: itemNumber,
            title: book.title,
            price: book.price,
            timestamp: new Date().toISOString()
        };
        
        orders.orders.push(newOrder);
        saveOrders();
        
        res.json({ 
            success: true, 
            message: `Purchased: ${book.title}`,
            order: newOrder
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process purchase' });
    }
});

app.listen(PORT, () => {
    console.log(`Order service running on port ${PORT}`);
});