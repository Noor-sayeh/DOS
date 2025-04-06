const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

let ordersList = []; // Initialize empty orders list

app.post('/OrderServer/purchase/:itemNumber', async (req, res) => {
    const itemNumber = req.params.itemNumber;
    
    try {
        // 1. Verify item exists and get current stock
        const catalogResponse = await axios.get('http://catalog:2001/CatalogServer/query', {
            params: { 
                searchBy: 'id', 
                idParam: itemNumber,
                operation: 'info' 
            }
        });

        // Handle case where book doesn't exist
        if (!catalogResponse.data || catalogResponse.data.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        const item = catalogResponse.data[0];
        
        // 2. Check stock availability
        if (item.quantity <= 0) {
            return res.status(400).json({ error: 'Item out of stock' });
        }

        // 3. Update stock in catalog
        const updateResponse = await axios.put(
            `http://catalog:2001/CatalogServer/updateStock/${itemNumber}`,
            { quantity: item.quantity - 1 }
        );

        // 4. Record the order
        const order = {
            orderNumber: ordersList.length + 1,
            bookId: itemNumber,
            title: item.title,
            remaining_quantity: updateResponse.data.item.stock
        };
        ordersList.push(order);

        console.log(`Purchased: ${item.title}`);
        console.log('Current orders:', ordersList);

        res.json({ 
            success: true,
            message: `Purchased: ${item.title}`,
            remainingStock: updateResponse.data.item.stock
        });

    } catch (error) {
        console.error('Purchase failed:', error.message);
        res.status(500).json({ 
            error: 'Purchase failed',
            details: error.response?.data || error.message
        });
    }
});

app.listen(2002, () => {
    console.log('Order service running on port 2002');
});