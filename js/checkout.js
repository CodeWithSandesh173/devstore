// Checkout functionality - Direct Buy
let orderItem = null;
let selectedPaymentMethod = 'esewa';
let appliedCoupon = null;
let subtotalAmount = 0;

// Initialize checkout
window.addEventListener('DOMContentLoaded', () => {
    // Load direct buy item from localStorage
    const directBuyData = localStorage.getItem('directBuyItem');

    if (!directBuyData) {
        alert('No product selected!');
        window.location.href = 'shop.html';
        return;
    }

    orderItem = JSON.parse(directBuyData);

    // Load user email
    onAuthStateChanged(user => {
        if (user) {
            document.getElementById('userEmail').value = user.email;
            loadRequirementFields();
            displayOrderSummary();
            showPaymentQR();
        }
    });
});

// Load requirement fields based on product
function loadRequirementFields() {
    const container = document.getElementById('productRequirements');
    const requirements = new Set();

    if (orderItem.requirements) {
        orderItem.requirements.split(',').forEach(req => requirements.add(req.trim()));
    }

    requirements.forEach(req => {
        const div = document.createElement('div');
        div.className = 'form-group';

        // Special handling for password fields
        const inputType = req.toLowerCase().includes('password') ? 'password' : 'text';

        div.innerHTML = `
            <label>${req}</label>
            <input type="${inputType}" name="requirement_${req.toLowerCase().replace(/\s+/g, '_')}" required placeholder="Enter your ${req}">
        `;
        container.appendChild(div);
    });
}

// Display order summary
function displayOrderSummary() {
    const summary = document.getElementById('orderSummary');
    subtotalAmount = orderItem.price;

    summary.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border);">
            <div>
                <strong>${orderItem.productName}</strong>
                <p class="text-muted" style="margin: 0; font-size: 0.9rem;">${orderItem.package}</p>
            </div>
            <strong>NPR ${orderItem.price}</strong>
        </div>
    `;

    updateTotals();
}

// Update totals
function updateTotals() {
    document.getElementById('subtotal').textContent = `NPR ${subtotalAmount}`;

    let finalAmount = subtotalAmount;

    if (appliedCoupon) {
        const discountAmount = Math.round(subtotalAmount * (appliedCoupon.discount / 100));
        document.getElementById('discountRow').style.display = 'block';
        document.getElementById('discountPercent').textContent = `${appliedCoupon.discount}%`;
        document.getElementById('discountAmount').textContent = discountAmount;
        finalAmount = subtotalAmount - discountAmount;
    } else {
        document.getElementById('discountRow').style.display = 'none';
    }

    document.getElementById('finalTotal').textContent = `NPR ${finalAmount}`;
}

// Select payment method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    showPaymentQR();
}

// Show payment QR code
function showPaymentQR() {
    const container = document.getElementById('paymentQR');

    if (selectedPaymentMethod === 'esewa') {
        container.innerHTML = `
            <h4>eSewa Payment</h4>
            <p class="text-muted">Scan this QR code with your eSewa app</p>
            <img src="images/esewa.png" alt="eSewa QR Code" class="qr-code">
        `;
    } else {
        container.innerHTML = `
            <h4>Bank Transfer</h4>
            <p class="text-muted">Scan this QR code for bank transfer</p>
            <img src="images/bank.png" alt="Bank QR Code" class="qr-code">
        `;
    }
}

// Apply coupon
async function applyCoupon() {
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const message = document.getElementById('couponMessage');

    if (!code) {
        message.textContent = 'Please enter a coupon code';
        message.className = 'text-danger mt-1';
        message.style.display = 'block';
        return;
    }

    try {
        const snapshot = await database.ref('coupons').orderByChild('code').equalTo(code).once('value');

        if (!snapshot.exists()) {
            message.textContent = 'Invalid coupon code';
            message.className = 'text-danger mt-1';
            message.style.display = 'block';
            appliedCoupon = null;
            updateTotals();
            return;
        }

        snapshot.forEach(child => {
            const coupon = child.val();
            if (coupon.active) {
                appliedCoupon = coupon;
                message.textContent = `Coupon applied! You saved ${coupon.discount}%`;
                message.className = 'text-success mt-1';
                message.style.display = 'block';
                updateTotals();
            } else {
                message.textContent = 'This coupon is expired';
                message.className = 'text-danger mt-1';
                message.style.display = 'block';
            }
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        message.textContent = 'Error applying coupon';
        message.className = 'text-danger mt-1';
        message.style.display = 'block';
    }
}

// Handle form submission
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert('Please login to continue');
        return;
    }

    // Collect requirement data
    const requirements = {};
    const inputs = document.querySelectorAll('#productRequirements input');
    inputs.forEach(input => {
        const key = input.name.replace('requirement_', '');
        requirements[key] = input.value;
    });

    const finalAmount = appliedCoupon
        ? subtotalAmount - Math.round(subtotalAmount * (appliedCoupon.discount / 100))
        : subtotalAmount;

    const orderData = {
        userId: user.uid,
        userEmail: user.email,
        items: [orderItem], // Single item array
        requirements: requirements,
        paymentMethod: selectedPaymentMethod,
        paymentProof: {
            imgbbLink: document.getElementById('paymentProofLink').value,
            accountNumber: document.getElementById('accountNumber').value,
            transactionId: document.getElementById('transactionId').value
        },
        subtotal: subtotalAmount,
        coupon: appliedCoupon ? appliedCoupon.code : null,
        discount: appliedCoupon ? appliedCoupon.discount : 0,
        total: finalAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    try {
        // Save order to Firebase
        const orderRef = await database.ref('orders').push(orderData);

        // Clear direct buy item
        localStorage.removeItem('directBuyItem');

        alert('Order placed successfully! Order ID: ' + orderRef.key);
        window.location.href = 'myorders.html';
    } catch (error) {
        alert('Error placing order: ' + error.message);
    }
});
