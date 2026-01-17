// Checkout functionality - Direct Buy
let orderItem = null;
let selectedPaymentMethod = null;
let appliedCoupon = null;
let subtotalAmount = 0;
let currentCurrency = 'USD'; // Default to USD
let currentCountry = null;
let uploadedImageBase64 = null; // Store compressed base64 image

// Rates
const RATE_USD_TO_NPR = 145;
const RATE_USD_TO_INR = 91;
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_IMAGE_WIDTH = 800; // Compress to max 800px width

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
            displayOrderSummary(); // Initial display

            // Check Email Verification
            if (!user.emailVerified) {
                const checkoutForm = document.getElementById('checkoutForm');
                const placeOrderBtn = document.getElementById('placeOrderBtn');

                // Disable button
                placeOrderBtn.disabled = true;
                placeOrderBtn.innerText = "❌ Email Verification Required";
                placeOrderBtn.classList.remove('btn-primary');
                placeOrderBtn.classList.add('btn-secondary');

                // Show Warning
                const warningDiv = document.createElement('div');
                warningDiv.className = 'alert alert-warning mt-3';
                warningDiv.style.border = '1px solid #ffc107';
                warningDiv.style.padding = '10px';
                warningDiv.style.borderRadius = '5px';
                warningDiv.style.backgroundColor = '#fff3cd';
                warningDiv.style.color = '#856404';
                warningDiv.innerHTML = `
                    <strong>⚠️ Account not verified!</strong><br>
                    Please verify your email address to place an order.<br>
                    <button type="button" class="btn btn-sm btn-outline-warning mt-2" onclick="resendVerification()">Resend Verification Email</button>
                    <p id="verifyMsg" class="mt-1" style="font-size:0.9rem;"></p>
                `;

                checkoutForm.insertBefore(warningDiv, placeOrderBtn);
            }
        }
    });
});

// Resend Verification Email
function resendVerification() {
    const user = firebase.auth().currentUser;
    if (user) {
        user.sendEmailVerification()
            .then(() => {
                const msg = document.getElementById('verifyMsg');
                msg.textContent = "✅ Verification email sent! Please check your inbox (and spam). Refresh this page after verifying.";
                msg.classList.add('text-success');
            })
            .catch((error) => {
                alert("Error sending email: " + error.message);
            });
    }
}

// Handle image upload with compression and preview
async function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const progressContainer = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadProgressBar');
    const statusText = document.getElementById('uploadStatus');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');
    const imageInfo = document.getElementById('imageInfo');

    // Show progress
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    statusText.textContent = 'Validating image...';

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('❌ Please select an image file (JPG, PNG, etc.)');
        input.value = '';
        progressContainer.style.display = 'none';
        return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        alert('❌ Image is too large! Maximum size is 1MB. Please choose a smaller image.');
        input.value = '';
        progressContainer.style.display = 'none';
        return;
    }

    progressBar.style.width = '20%';
    statusText.textContent = 'Reading image...';

    try {
        // Compress image
        progressBar.style.width = '40%';
        statusText.textContent = 'Compressing image...';

        const compressedBase64 = await compressImage(file, MAX_IMAGE_WIDTH);

        progressBar.style.width = '80%';
        statusText.textContent = 'Preparing preview...';

        // Store the compressed image
        uploadedImageBase64 = compressedBase64;

        // Show preview
        preview.src = compressedBase64;
        previewContainer.style.display = 'block';

        // Calculate and show size info
        const originalSize = (file.size / 1024).toFixed(2);
        const compressedSize = ((compressedBase64.length * 3) / 4 / 1024).toFixed(2);
        imageInfo.textContent = `Original: ${originalSize} KB → Compressed: ${compressedSize} KB`;

        progressBar.style.width = '100%';
        statusText.textContent = '✅ Image ready!';
        statusText.classList.add('text-success');

        // Hide progress after 2 seconds
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            statusText.textContent = 'Processing image...';
            statusText.classList.remove('text-success');
        }, 2000);

    } catch (error) {
        console.error('Error processing image:', error);
        alert('❌ Error processing image. Please try a different file.');
        input.value = '';
        uploadedImageBase64 = null;
        progressContainer.style.display = 'none';
        previewContainer.style.display = 'none';
    }
}

// Compress image to reduce size
function compressImage(file, maxWidth = 800) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG with 80% quality for better compression
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };

            img.onerror = reject;
        };

        reader.onerror = reject;
    });
}

// Load requirement fields based on product
function loadRequirementFields() {
    const container = document.getElementById('productRequirements');
    container.innerHTML = ''; // Clear previous
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

    let displayPrice = 0;
    let symbol = '$';

    const basePrice = parseFloat(orderItem.price);
    const baseCurrency = orderItem.currency || 'NPR'; // Default to legacy NPR

    // Calculation Logic
    if (baseCurrency === 'USD') {
        // Base is USD
        if (currentCurrency === 'USD') {
            displayPrice = basePrice.toFixed(2);
            symbol = '$';
        } else if (currentCurrency === 'NPR') {
            displayPrice = Math.ceil(basePrice * RATE_USD_TO_NPR);
            symbol = 'NPR';
        } else if (currentCurrency === 'INR') {
            displayPrice = Math.ceil(basePrice * RATE_USD_TO_INR);
            symbol = 'INR';
        }
    } else {
        // Base is NPR
        if (currentCurrency === 'USD') {
            displayPrice = (basePrice / RATE_USD_TO_NPR).toFixed(2);
            symbol = '$';
        } else if (currentCurrency === 'NPR') {
            displayPrice = basePrice;
            symbol = 'NPR';
        } else if (currentCurrency === 'INR') {
            displayPrice = Math.ceil((basePrice / RATE_USD_TO_NPR) * RATE_USD_TO_INR);
            symbol = 'INR';
        }
    }

    subtotalAmount = displayPrice;

    summary.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border);">
            <div>
                <strong>${orderItem.productName}</strong>
                <p class="text-muted" style="margin: 0; font-size: 0.9rem;">${orderItem.package}</p>
            </div>
            <strong>${symbol} ${displayPrice}</strong>
        </div>
    `;

    updateTotals();
}

// Update Country Logic
function updateCountry(country) {
    currentCountry = country;
    const message = document.getElementById('countryMessage');
    const paymentSection = document.getElementById('paymentSection');
    const methodsContainer = document.getElementById('paymentMethodsContainer');

    // Reset state
    selectedPaymentMethod = null;
    document.getElementById('paymentQR').innerHTML = '';
    message.style.display = 'block';

    if (!country) {
        message.style.display = 'none';
        paymentSection.style.display = 'none';
        currentCurrency = 'USD';
        displayOrderSummary();
        return;
    }

    if (country === 'nepal') {
        currentCurrency = 'NPR';
        message.textContent = "✅ Working - Pay via eSewa / Bank";
        message.className = "mt-1 text-success";
        paymentSection.style.display = 'block';

        // Populate methods
        methodsContainer.innerHTML = `
            <div class="payment-option" data-method="esewa" onclick="selectPaymentMethod('esewa')">
                <strong>📱 eSewa</strong>
                <p class="text-muted" style="margin: 0;">Pay via eSewa wallet</p>
            </div>
            <div class="payment-option" data-method="bank" onclick="selectPaymentMethod('bank')">
                <strong>🏦 Bank Transfer</strong>
                <p class="text-muted" style="margin: 0;">Direct bank deposit</p>
            </div>
        `;

    } else if (country === 'india') {
        currentCurrency = 'INR';
        message.textContent = "✅ Working - Pay via Bank Transfer";
        message.className = "mt-1 text-success";
        paymentSection.style.display = 'block';

        // Populate methods (Use generic global bank QR)
        methodsContainer.innerHTML = `
            <div class="payment-option" data-method="bank" onclick="selectPaymentMethod('bank')">
                <strong>🏦 Bank Transfer (Global)</strong>
                <p class="text-muted" style="margin: 0;">Scan QR Code to Pay</p>
            </div>
        `;

    } else if (country === 'pakistan' || country === 'bangladesh') {
        currentCurrency = 'NPR'; // Or USD?
        message.textContent = "🚧 Coming Soon - Payments not yet available";
        message.className = "mt-1 text-warning";
        paymentSection.style.display = 'none';
    } else {
        message.style.display = 'none';
        paymentSection.style.display = 'none';
    }

    displayOrderSummary();
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

    if (currentCountry === 'nepal') {
        if (selectedPaymentMethod === 'esewa') {
            container.innerHTML = `
                <h4>eSewa Payment (NPR)</h4>
                <p class="text-muted">Scan this QR code with your eSewa app</p>
                <img src="images/esewa.png" alt="eSewa QR Code" class="qr-code">
                <p class="mt-2 text-primary">Total: NPR ${document.getElementById('finalTotal').innerText.replace(/[^0-9]/g, '')}</p>
            `;
        } else if (selectedPaymentMethod === 'bank') {
            container.innerHTML = `
                <h4>Bank Transfer (Nepal)</h4>
                <p class="text-muted">Scan or transfer to details below</p>
                <img src="images/bank.png" alt="Bank QR Code" class="qr-code">
                 <p class="mt-2 text-primary">Total: NPR ${document.getElementById('finalTotal').innerText.replace(/[^0-9]/g, '')}</p>
            `;
        }
    } else if (currentCountry === 'india') {
        // India logic updated to use Global QR
        if (selectedPaymentMethod === 'bank') {
            container.innerHTML = `
                <h4>Bank Transfer (Global / India)</h4>
                <p class="text-muted">Scan using any UPI or Banking App</p>
                <img src="images/bank.png" alt="Global Bank QR Code" class="qr-code">
                <p class="mt-2 text-primary">Total: INR ${document.getElementById('finalTotal').innerText.replace(/[^0-9.]/g, '')}</p>
            `;
        }
    }
}

// Update totals
function updateTotals() {
    const symbol = currentCurrency === 'USD' ? '$' : currentCurrency;

    document.getElementById('subtotal').textContent = `${symbol} ${subtotalAmount}`;

    // For calculations if USD is float
    let subtotalVal = parseFloat(subtotalAmount);


    let finalAmount = subtotalAmount;
    let discountAmount = 0;

    if (appliedCoupon) {
        if (currentCurrency === 'USD') {
            discountAmount = (subtotalVal * (appliedCoupon.discount / 100)).toFixed(2);
            finalAmount = (subtotalVal - discountAmount).toFixed(2);
        } else {
            discountAmount = Math.round(subtotalVal * (appliedCoupon.discount / 100));
            finalAmount = subtotalVal - discountAmount;
        }

        document.getElementById('discountRow').style.display = 'block';
        document.getElementById('discountPercent').textContent = `${appliedCoupon.discount}%`;
        document.getElementById('discountAmount').textContent = `${symbol} ${discountAmount}`;
    } else {
        document.getElementById('discountRow').style.display = 'none';

        // Ensure decimal consistency
        if (currentCurrency === 'USD' && typeof finalAmount === 'string') {
            // it's already formatted
        } else if (currentCurrency === 'USD') {
            finalAmount = finalAmount.toFixed(2);
        }
    }

    document.getElementById('finalTotal').textContent = `${symbol} ${finalAmount}`;
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

    if (!user.emailVerified) {
        alert('Please verify your email address before placing an order.');
        return;
    }

    if (!selectedPaymentMethod) {
        alert('Please select a payment method');
        return;
    }

    // Validate image upload
    if (!uploadedImageBase64) {
        alert('❌ Please upload a payment screenshot');
        return;
    }

    // Collect requirement data
    const requirements = {};
    const inputs = document.querySelectorAll('#productRequirements input');
    inputs.forEach(input => {
        const key = input.name.replace('requirement_', '');
        requirements[key] = input.value;
    });

    // Parse final total from text content to ensure it matches display
    const finalTotalText = document.getElementById('finalTotal').textContent;
    // Extract number
    const finalTotalVal = parseInt(finalTotalText.replace(/[^0-9]/g, ''));

    const orderData = {
        userId: user.uid,
        userEmail: user.email,
        items: [orderItem], // Single item array
        requirements: requirements,
        paymentMethod: selectedPaymentMethod,
        country: currentCountry,
        currency: currentCurrency,
        paymentProof: {
            base64Image: uploadedImageBase64, // Store compressed base64 image
            accountNumber: document.getElementById('accountNumber').value,
            transactionId: document.getElementById('transactionId').value
        },
        subtotal: subtotalAmount,
        coupon: appliedCoupon ? appliedCoupon.code : null,
        discount: appliedCoupon ? appliedCoupon.discount : 0,
        total: `${currentCurrency} ${finalTotalVal}`, // Save with currency code
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    try {
        // Save order to Firebase
        const orderRef = await database.ref('orders').push(orderData);

        // Clear direct buy item
        localStorage.removeItem('directBuyItem');

        alert('✅ Order placed successfully! Order ID: ' + orderRef.key);
        window.location.href = 'myorders.html';
    } catch (error) {
        console.error('Order submission error:', error);
        alert('❌ Error placing order: ' + error.message);
    }
});
