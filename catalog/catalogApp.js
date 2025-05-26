const data = require('./DB');
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// 👇 رابط replica الثانية (غيريه حسب النسخة)
const REPLICA_URL = process.env.REPLICA_URL || 'http://catalog2:2001'; // لو كنتِ catalog1

// Logger
app.use((req, res, next) => {
    console.log(`[Catalog] ${req.method} ${req.path}`);
    next();
});

app.listen(2001, () => {
    console.log(`[Catalog] Service running on port 2001`);
});

// 🔍 Query endpoint
app.get('/CatalogServer/query', async (req, res) => {
    try {
        const searchBy = req.query.searchBy;

        if (searchBy === "topic") {
            const topic = req.query.topicParam;
            const filteredDB = data.filter(book => book.topic === topic);
            if (filteredDB.length > 0) {
                const bookInfo = filteredDB.map(book => ({ id: book.id, topic: book.topic }));
                return res.json(bookInfo);
            } else {
                return res.status(404).json({ message: 'No books found for the given topic' });
            }
        } else if (searchBy === "id") {
            const id = req.query.idParam;
            const filteredDB = data.filter(book => book.id === id);
            if (filteredDB.length > 0) {
                const bookInfo = filteredDB.map(book => ({
                    title: book.title,
                    quantity: book.stock,
                    price: book.cost
                }));
                return res.json(bookInfo);
            } else {
                return res.status(404).json({ message: 'No books has this id', cause: 'not found' });
            }
        } else {
            return res.status(400).json({ error: 'Invalid searchBy parameter' });
        }

    } catch (error) {
        console.error('[Catalog] Error in query:', error.message);
        res.status(500).json({ error: 'Error fetching data from database' });
    }
});

// ✅ Stock update + sync
app.put('/CatalogServer/updateStock/:itemNumber', async (req, res) => {
    try {
        const itemNumber = req.params.itemNumber;
        const item = data.find(book => book.id === itemNumber);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (item.stock > 0) {
            item.stock -= 1;
            console.log(`[Catalog] Stock updated for ${itemNumber}. New stock: ${item.stock}`);

            // ✨ Send stock sync to replica
            try {
                await axios.put(`${REPLICA_URL}/CatalogServer/syncStock/${itemNumber}`, {
                    stock: item.stock
                });
                console.log(`[Catalog] Synced stock with replica`);
            } catch (err) {
                console.error(`[Catalog] Failed to sync stock with replica:`, err.message);
            }

            res.json({
                message: `Stock updated successfully. Remaining stock: ${item.stock}`,
                item
            });
        } else {
            res.status(400).json({ error: 'Item is out of stock', item });
        }
    } catch (error) {
        console.error('[Catalog] Stock update error:', error.message);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

// ✅ Item full update + sync
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

        // ✨ Sync updated values to replica
        try {
            await axios.put(`${REPLICA_URL}/CatalogServer/syncItem/${itemNumber}`, {
                price: item.cost,
                stock: item.stock
            });
            console.log(`[Catalog] Synced item update with replica`);
        } catch (err) {
            console.error(`[Catalog] Failed to sync item update:`, err.message);
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
        console.error('[Catalog] Update error:', error.message);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// 🟢 Receive stock sync from replica
app.put('/CatalogServer/syncStock/:itemNumber', (req, res) => {
    const itemNumber = req.params.itemNumber;
    const { stock } = req.body;

    const item = data.find(book => book.id === itemNumber);
    if (!item) return res.status(404).json({ message: 'Item not found for sync' });

    item.stock = stock;
    console.log(`[Catalog] Synchronized stock for ${itemNumber}. New stock: ${stock}`);
    res.json({ message: 'Stock synchronized successfully' });
});

// 🟢 Receive item sync (price + stock)
app.put('/CatalogServer/syncItem/:itemNumber', (req, res) => {
    const itemNumber = req.params.itemNumber;
    const { stock, price } = req.body;

    const item = data.find(book => book.id === itemNumber);
    if (!item) return res.status(404).json({ message: 'Item not found for sync' });

    if (stock !== undefined) item.stock = stock;
    if (price !== undefined) item.cost = price;

    console.log(`[Catalog] Synchronized full item for ${itemNumber}: { stock: ${stock}, price: ${price} }`);
    res.json({ message: 'Item synchronized successfully' });
});
