import express from 'express';
import axios from 'axios';
const app = express();
app.use(express.json());

// Custom logger middleware
app.use((req, res, next) => {
    console.log(`[Frontend] ${req.method} ${req.path}`);
    next();
});

app.listen(2000, () => {
    console.log(`[Frontend] Service running on port 2000`);
});

// Search books by topic
app.get('/Bazarcom/Search/:topic', async (req, res) => {
    try {
        const topicParam = req.params.topic;
        console.log(`[Frontend] Searching for topic: ${topicParam}`);
        
        const searchBy = "topic";
        const operation = "search";
        const response = await axios.get('http://catalog:2001/CatalogServer/query', {
            params: { topicParam, searchBy, operation }
        });
        
        console.log(`[Frontend] Search results for ${topicParam}:`, response.data);
        res.json(response.data);
    } catch (error) {
        console.error('[Frontend] Error fetching data:', error.message);
        res.status(404).json({ error: 'Item not found' });
    }
});

// Search books by id
app.get('/Bazarcom/info/:id', async (req, res) => {
    try {
        const idParam = req.params.id;
        console.log(`[Frontend] Getting info for book ID: ${idParam}`);
        
        const searchBy = "id";
        const operation = "info";
        const response = await axios.get('http://catalog:2001/CatalogServer/query', {
            params: { idParam, searchBy, operation }
        });
        
        console.log(`[Frontend] Book info for ${idParam}:`, response.data);
        res.json(response.data);
    } catch (error) {
        console.error('[Frontend] Error fetching book info:', error.message);
        res.status(404).json({ error: 'Item not found' });
    }
});

// Make purchase 
app.post('/Bazarcom/purchase/:id', async (req, res) => {
    try {
        const idParam = req.params.id;
        console.log(`[Frontend] Attempting purchase for book ID: ${idParam}`);
        
        const response = await axios.post(`http://order:2002/OrderServer/purchase/${idParam}`);
        
        console.log(`[Frontend] Purchase result for ${idParam}:`, response.data);
        res.json(response.data);
    } catch (error) {
        console.error('[Frontend] Error purchasing book:', error.message);
        res.status(404).json({ error: 'Failed to purchase item' });
    }
});