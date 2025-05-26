import express from 'express';
import axios from 'axios';
const app = express();
app.use(express.json());

let catalogReplicas = ["http://catalog1:2001", "http://catalog2:2001"];
let orderReplicas = ["http://order1:2002", "http://order2:2002"];
let catalogIndex = 0;
let orderIndex = 0;

function getNextCatalog() {
    const url = catalogReplicas[catalogIndex];
    catalogIndex = (catalogIndex + 1) % catalogReplicas.length;
    return url;
}

function getNextOrder() {
    const url = orderReplicas[orderIndex];
    orderIndex = (orderIndex + 1) % orderReplicas.length;
    return url;
}

app.use((req, res, next) => {
    console.log(`[Frontend] ${req.method} ${req.path}`);
    next();
});

app.listen(2000, () => {
    console.log(`[Frontend] Service running on port 2000`);
});

app.get('/Bazarcom/Search/:topic', async (req, res) => {
    try {
        const topicParam = req.params.topic;
        const searchBy = "topic";
        const operation = "search";
        const catalogUrl = getNextCatalog();

        const response = await axios.get(`${catalogUrl}/CatalogServer/query`, {
            params: { topicParam, searchBy, operation }
        });

        res.json(response.data);
    } catch (error) {
        console.error('[Frontend] Error fetching data:', error.message);
        res.status(404).json({ error: 'Item not found' });
    }
});

app.get('/Bazarcom/info/:id', async (req, res) => {
    try {
        const idParam = req.params.id;
        const searchBy = "id";
        const operation = "info";
        const catalogUrl = getNextCatalog();

        const response = await axios.get(`${catalogUrl}/CatalogServer/query`, {
            params: { idParam, searchBy, operation }
        });

        res.json(response.data);
    } catch (error) {
        console.error('[Frontend] Error fetching book info:', error.message);
        res.status(404).json({ error: 'Item not found' });
    }
});

app.post('/Bazarcom/purchase/:id', async (req, res) => {
    try {
        const idParam = req.params.id;
        const orderUrl = getNextOrder();

        const response = await axios.post(`${orderUrl}/OrderServer/purchase/${idParam}`);

        res.json(response.data);
    } catch (error) {
        console.error('[Frontend] Error purchasing book:', error.message);
        res.status(404).json({ error: 'Failed to purchase item' });
    }
});
