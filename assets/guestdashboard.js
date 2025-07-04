document.getElementById('trackBtn').addEventListener('click', async () => {
    const email = document.getElementById('trackEmail').value.trim();
    const phone = document.getElementById('trackPhone').value.trim();
    const resultBox = document.querySelector('.result-box');
    const errorBox = document.getElementById('errorMessage');
    
    resultBox.innerHTML = '';
    errorBox.textContent = '';

    if (!email || !phone) {
        errorBox.textContent = 'Email and Phone are required.';
        return;
    }

    try {
        const response = await fetch('https://pureplucks.com/api/orders/track-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, phone })
        });

        const data = await response.json();

        if (!response.ok) {
            errorBox.textContent = data.message || 'Something went wrong.';
            return;
        }

        if (!data.orders || data.orders.length === 0) {
            errorBox.textContent = 'No orders found.';
            return;
        }
        
        // Clear resultBox first to avoid duplication
        resultBox.innerHTML = '';

        // Sort orders by date (newest first)
        data.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

        // Iterate through sorted orders and dynamically render their statuses
        data.orders.forEach(order => {
            const items = order.orderItems.map(prod => `
                <li>
                    <strong>${prod.name}</strong> — Qty: ${prod.quantity}
                </li>
            `).join('');

          const orderHtml = `
    <div class="order-block">
        <!-- Unique Order Status Section -->
        <div class="order-status-text">
            <h4>Latest Status:</h4>
            <strong>Status:</strong> ${order.orderStatus} <br>
            <strong>Payment:</strong> ${order.paymentStatus} <br>
            <strong>Method:</strong> ${order.paymentMethod} <br>
            <strong>Total:</strong> ₹${order.finalTotal} <br>
        </div>

        <!-- Additional Order Details -->
        <strong>Order ID:</strong> ${order.orderId || order._id} <br> 
        <p><strong>Tracking ID:</strong> ${order.trackingId || "N/A"}</p>
        <p><strong>Courier Partner:</strong> ${order.courierPartner || "N/A"}</p>
        <p><strong>Name:</strong> ${order.name}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
        <p><strong>Shipping Address:</strong> 
            ${order.shippingAddress.street}, 
            ${order.shippingAddress.city}, 
            ${order.shippingAddress.state}, 
            ${order.shippingAddress.zipcode}, 
            ${order.shippingAddress.country}
        </p>

         <p><strong>Item Total:</strong> ₹${order.totalPrice}</p>
        <p><strong>Shipping Charges:</strong> ₹${order.shippingCharges}</p>
        <p><strong>Applied Coupons:</strong> ${order.appliedCoupons.length > 0 ? order.appliedCoupons.join(', ') : 'None'}</p>
        <p><strong>Final Total:</strong> ₹${order.finalTotal}</p>

        <p><strong>Items:</strong></p>
        <ul>${items}</ul>
    </div>
`;

            // Append each order's details (including its status) to resultBox
            resultBox.innerHTML += orderHtml;
        });

    } catch (err) {
        console.error('Track Order Error:', err);
        errorBox.textContent = 'Failed to connect to server.';
    }
});
