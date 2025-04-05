const data = require('./DB');
const express = require('express');
const app = express();
app.use(express.json());

// Custom logger middleware
app.use((req, res, next) => {
    console.log(`[Catalog] ${req.method} ${req.path}`);
    next();
});

app.listen(2001, () => {
    console.log(`[Catalog] Service running on port 2001`);
});

// Query endpoint
app.get('/CatalogServer/query', async (req, res) => {
    try {
        const searchBy = req.query.searchBy;
        console.log(`[Catalog] Received query with searchBy: ${searchBy}`);

        if(searchBy == "topic") {
            const topic = req.query.topicParam;
            console.log(`[Catalog] Searching for topic: ${topic}`);
            
            const filteredDB = data.filter(book => book.topic === topic);
            
            if(filteredDB.length > 0) {
                const bookInfo = filteredDB.map(book => {
                    return { id: book.id, topic: book.topic };
                });
                console.log(`[Catalog] Found ${bookInfo.length} books for topic ${topic}`);
                res.json(bookInfo);
            } else {
                console.log(`[Catalog] No books found for topic: ${topic}`);
                res.status(404).json({ message: 'No books found for the given topic' });
            }
        }
        else if(searchBy == "id") {
            const id = req.query.idParam;
            const operation = req.query.operation;
            console.log(`[Catalog] Looking up info for book ID: ${id}`);
            
            const filteredDB = data.filter(book => book.id === id);
            
            if(filteredDB.length > 0) {
                const bookInfo = filteredDB.map(book => {
                    return { 
                        title: book.title, 
                        quantity: book.stock,
                        price: book.cost 
                    };
                });
                console.log(`[Catalog] Book info found for ID ${id}:`, bookInfo[0]);
                res.json(bookInfo);
            } else {
                console.log(`[Catalog] No book found with ID: ${id}`);
                res.status(404).json({ message: 'No books has this id', cause: 'not found' });
            }
        } else {
            console.log(`[Catalog] Invalid searchBy parameter: ${searchBy}`);
            res.status(400).json({ error: 'Invalid searchBy parameter' });
        }
    } catch (error) {
        console.error('[Catalog] Error in query:', error.message);
        res.status(500).json({ error: 'Error fetching data from database' }); 
    }
});

// Stock update endpoint (deducts 1)
app.put('/CatalogServer/updateStock/:itemNumber', async (req, res) => {
    try {
        const itemNumber = req.params.itemNumber;
        console.log(`[Catalog] Stock update request for item: ${itemNumber}`);
        
        const item = data.find(book => book.id === itemNumber);

        if (!item) {
            console.log(`[Catalog] Item not found: ${itemNumber}`);
            return res.status(404).json({ message: 'Item not found' });
        }

        if (item.stock > 0) {
            item.stock -= 1;
            console.log(`[Catalog] Stock updated for ${itemNumber}. New stock: ${item.stock}`);
            res.json({ 
                message: `Stock updated successfully. Remaining stock: ${item.stock}`,
                item 
            });
        } else {
            console.log(`[Catalog] Out of stock for item: ${itemNumber}`);
            res.status(400).json({ error: 'Item is out of stock', item });
        }
    } catch (error) {
        console.error('[Catalog] Stock update error:', error.message);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

// Flexible update endpoint
app.put('/CatalogServer/updateItem/:itemNumber', async (req, res) => {
    try {
        const itemNumber = req.params.itemNumber;
        const { price, stock } = req.body;
        console.log(`[Catalog] Update request for ${itemNumber}:`, { price, stock });
        
        const item = data.find(book => book.id === itemNumber);

        if (!item) {
            console.log(`[Catalog] Item not found for update: ${itemNumber}`);
            return res.status(404).json({ error: 'Item not found' });
        }

        let updates = [];
        if (price !== undefined) {
            item.cost = price;
            updates.push('price');
        }
        if (stock !== undefined) {
            item.stock = stock;
            updates.push('stock');
        }

        if (updates.length === 0) {
            console.log(`[Catalog] No valid updates provided for ${itemNumber}`);
            return res.status(400).json({ error: 'No valid updates provided' });
        }

        const result = {
            success: true,
            message: `Updated ${updates.join(' and ')} for item ${itemNumber}`,
            updatedItem: {
                id: item.id,
                title: item.title,
                price: item.cost,
                stock: item.stock
            }
        };

        console.log(`[Catalog] Update successful for ${itemNumber}:`, result);
        res.json(result);

    } catch (error) {
        console.error('[Catalog] Update error:', error.message);
        res.status(500).json({ error: 'Failed to update item' });
    }
});