// Enhanced order details view for admin
function viewOrderDetails(orderId) {
    database.ref(`orders/${orderId}`).once('value', snapshot => {
        const order = snapshot.val();

        // Build detailed order view
        let detailsHTML = `
            <h2>Order Details #${orderId.substring(0, 8)}</h2>
            <div style="background: var(--color-background); padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1rem;">
                <h3>Customer Information</h3>
                <p><strong>Email:</strong> ${order.userEmail}</p>
                <p><strong>User ID:</strong> ${order.userId}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span></p>
            </div>

            <div style="background: var(--color-background); padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1rem;">
                <h3>Product Requirements</h3>`;

        if (order.requirements && Object.keys(order.requirements).length > 0) {
            for (let key in order.requirements) {
                detailsHTML += `<p><strong>${key.replace(/_/g, ' ').toUpperCase()}:</strong> ${order.requirements[key]}</p>`;
            }
        } else {
            detailsHTML += `<p class="text-muted">No requirements provided</p>`;
        }

        detailsHTML += `</div>
            
            <div style="background: var(--color-background); padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1rem;">
                <h3>Order Items</h3>`;

        order.items.forEach(item => {
            detailsHTML += `
                <div style="padding: 0.75rem; border-bottom: 1px solid var(--color-border); margin-bottom: 0.5rem;">
                    <p><strong>${item.productName}</strong></p>
                    <p class="text-muted">${item.package}</p>
                    <p class="text-primary"><strong>NPR ${item.price}</strong></p>
                </div>`;
        });

        detailsHTML += `</div>
            
            <div style="background: var(--color-background); padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1rem;">
                <h3>Payment Information</h3>
                <p><strong>Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                <p><strong>Payment Proof Link:</strong> <a href="${order.paymentProof.imgbbLink}" target="_blank" class="text-primary">View Screenshot</a></p>
                <p><strong>Account Number:</strong> ${order.paymentProof.accountNumber}</p>
                <p><strong>Transaction ID:</strong> ${order.paymentProof.transactionId}</p>
            </div>

            <div style="background: var(--color-background); padding: 1rem; border-radius: var(--border-radius);">
                <h3>Price Breakdown</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>Subtotal:</span>
                    <strong>NPR ${order.subtotal}</strong>
                </div>`;

        if (order.discount) {
            const discountAmount = Math.round(order.subtotal * (order.discount / 100));
            detailsHTML += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: var(--color-success);">
                    <span>Discount (${order.discount}% - ${order.coupon}):</span>
                    <strong>- NPR ${discountAmount}</strong>
                </div>`;
        }

        detailsHTML += `
                <div style="display: flex; justify-content: space-between; font-size: 1.25rem; padding-top: 0.5rem; border-top: 2px solid var(--color-border);">
                    <strong>Total:</strong>
                    <strong class="text-primary">NPR ${order.total}</strong>
                </div>
            </div>`;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                ${detailsHTML}
                <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    });
}
