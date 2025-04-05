const data = require('./DB');
const express = require('express');
const app = express();
app.use(express.json());

app.listen(2001, () => {
    console.log(`CatalogServer is running on port 2001`);
});

// Existing query endpoint
app.get('/CatalogServer/query', async (req, res) => {
    try {
        const searchBy = req.query.searchBy;  

        if(searchBy == "topic"){
            const topic = req.query.topicParam;
            const filteredDB = data.filter(book => book.topic === topic);
            
            if(filteredDB.length > 0){
                const bookInfo = filteredDB.map(book => {
                    return { id: book.id, topic: book.topic };
                });
                res.json(bookInfo);
            } else {
                res.status(404).json({ message: 'No books found for the given topic' });
            }
        }
        else if(searchBy == "id"){
            const id = req.query.idParam;
            const operation = req.query.operation;
            const filteredDB = data.filter(book => book.id === id);
            
            if(filteredDB.length > 0){
                const bookInfo = filteredDB.map(book => {
                    return { 
                        title: book.title, 
                        quantity: book.stock,
                        price: book.cost 
                    };
                });
                res.json(bookInfo);
            } else {
                res.status(404).json({ message: 'No books has this id', cause: 'not found' });
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data from database' }); 
    }
});

// Existing stock update endpoint (deducts 1)
app.put('/CatalogServer/updateStock/:itemNumber', async (req, res) => {
    try {
        const itemNumber = req.params.itemNumber;
        const item = data.find(book => book.id === itemNumber);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (item.stock > 0) {
            item.stock -= 1;
            res.json({ 
                message: `Stock updated successfully. Remaining stock: ${item.stock}`,
                item 
            });
        } else {
            res.status(400).json({ error: 'Item is out of stock', item });
        }
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

// NEW: Flexible update endpoint
app.put('/CatalogServer/updateItem/:itemNumber', async (req, res) => {
    try {
        const itemNumber = req.params.itemNumber;
        const { price, stock } = req.body;
        const item = data.find(book => book.id === itemNumber);

        if (!item) {
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
            return res.status(400).json({ error: 'No valid updates provided' });
        }

        res.json({
            success: true,
            message: `Updated ${updates.join(' and ')} for item ${itemNumber}`,
            updatedItem: {
                id: item.id,
                title: item.title,
                price: item.cost,
                stock: item.stock
            }
        });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});