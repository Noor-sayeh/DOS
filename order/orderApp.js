const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

let ordersList = [];

// 🔁 تحديد replica الثانية
const REPLICA_URL = process.env.REPLICA_URL || "http://order2:2002"; // لو كنتِ في order1
// لاحقًا بتغيريها لـ order1 لما تكوني في order2

// 🔁 Load balancing للـ catalog
const catalogReplicas = ["http://catalog1:2001", "http://catalog2:2001"];
let catalogIndex = 0;
function getNextCatalog() {
    const url = catalogReplicas[catalogIndex];
    catalogIndex = (catalogIndex + 1) % catalogReplicas.length;
    return url;
}

// ✅ عملية الشراء
app.post('/OrderServer/purchase/:itemNumber', async (req, res) => {
    const itemNumber = req.params.itemNumber;

    try {
        // 1. استعلام عن الكتاب من كاتالوج واحد
        const catalogUrl = getNextCatalog();
        const catalogResponse = await axios.get(`${catalogUrl}/CatalogServer/query`, {
            params: {
                searchBy: 'id',
                idParam: itemNumber,
                operation: 'info'
            }
        });

        if (!catalogResponse.data || catalogResponse.data.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        const item = catalogResponse.data[0];

        // 2. تحقق من توفر الستوك
        if (item.quantity <= 0) {
            return res.status(400).json({ error: 'Item out of stock' });
        }

        // 3. خصم من الستوك من نفس replica
        const updateResponse = await axios.put(
            `${catalogUrl}/CatalogServer/updateStock/${itemNumber}`,
            { quantity: item.quantity - 1 }
        );

        // 4. تسجيل الطلب
        const order = {
            orderNumber: ordersList.length + 1,
            bookId: itemNumber,
            title: item.title,
            remaining_quantity: updateResponse.data.item.stock
        };
        ordersList.push(order);
        console.log(`Purchased: ${item.title}`);
        console.log('Current orders:', ordersList);

        // 5. إرسال الطلب إلى replica الثانية
        try {
            await axios.post(`${REPLICA_URL}/OrderServer/syncOrder`, order);
            console.log('[Order] Synced order with replica');
        } catch (err) {
            console.error('[Order] Failed to sync order with replica:', err.message);
        }

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

// ✅ endpoint لاستقبال الطلب من الـ replica الثانية
app.post('/OrderServer/syncOrder', (req, res) => {
    const order = req.body;

    // تحقق إذا الطلب مكرر (بناءً على رقم الطلب)
    const exists = ordersList.find(o => o.orderNumber === order.orderNumber);
    if (!exists) {
        ordersList.push(order);
        console.log(`[Order] Synchronized order from replica:`, order);
    }

    res.json({ message: 'Order synchronized successfully' });
});

app.listen(2002, () => {
    console.log('Order service running on port 2002');
});
