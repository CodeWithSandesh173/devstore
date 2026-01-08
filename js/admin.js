// Admin Dashboard JavaScript
// Handles all admin CRUD operations for products, orders, coupons, announcements, Black Friday, and chats

// Show different admin sections
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    event.target.classList.add('active');

    // Load data for the section
    loadSectionData(sectionName);
}

// Load data for each section
function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'products':
            loadProductsList();
            break;
        case 'orders':
            loadOrdersList();
            break;
        case 'coupons':
            loadCouponsList();
            break;
        case 'announcements':
            loadCurrentAnnouncement();
            break;
        case 'blackfriday':
            loadBlackFridayDeals();
            break;
        case 'chats':
            loadChatsList();
            break;
    }
}

// ===== DASHBOARD ===== 
function loadDashboardStats() {
    // Count products
    database.ref('products').once('value', snapshot => {
        document.getElementById('statProducts').textContent = snapshot.numChildren();
    });

    // Count orders and calculate revenue
    database.ref('orders').once('value', snapshot => {
        let totalOrders = 0;
        let pendingOrders = 0;
        let totalRevenue = 0;

        snapshot.forEach(child => {
            const order = child.val();
            totalOrders++;
            if (order.status === 'pending') pendingOrders++;

            // Robust fix for Revenue: handle numbers, strings, "NPR 1,200", etc.
            let orderTotal = 0;
            if (order.total !== undefined && order.total !== null) {
                // Convert to string, strip everything except numbers and dots
                const cleanTotal = String(order.total).replace(/[^0-9.]/g, '');
                orderTotal = parseFloat(cleanTotal);
            }

            // Check if result is finite, otherwise default to 0
            if (!Number.isFinite(orderTotal)) {
                orderTotal = 0;
            }

            if (order.status === 'completed') totalRevenue += orderTotal;
        });

        document.getElementById('statOrders').textContent = totalOrders;
        document.getElementById('statPending').textContent = pendingOrders;
        document.getElementById('statRevenue').textContent = `NPR ${totalRevenue.toLocaleString()}`; // Add comma formatting
    });
}

// ===== PRODUCTS =====
function loadProductsList() {
    database.ref('products').once('value', snapshot => {
        const container = document.getElementById('productsList');
        container.innerHTML = '';

        snapshot.forEach(child => {
            const product = child.val();
            const div = document.createElement('div');
            div.className = 'card';
            div.style.marginBottom = '1rem';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3>${product.name}</h3>
                        <p class="text-muted">${product.category} - ${product.packages.length} packages</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="editProduct('${product.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

// Helper to add package input row
function addPackageInput(label = '', price = '') {
    const container = document.getElementById('packagesContainer');
    const div = document.createElement('div');
    div.className = 'package-row';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';
    div.innerHTML = `
        <input type="text" placeholder="Label (e.g. 60 UC)" class="package-label" value="${label}" required>
        <input type="number" placeholder="Price" class="package-price" value="${price}" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

function showAddProductModal() {
    document.getElementById('productForm').reset();
    document.getElementById('packagesContainer').innerHTML = '';
    // Add one empty package row by default
    addPackageInput();

    document.getElementById('productId').readOnly = false;
    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

function editProduct(productId) {
    database.ref(`products/${productId}`).once('value', snapshot => {
        const product = snapshot.val();
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productImage').value = product.image;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productRequirements').value = product.requirements;

        // Load packages
        const container = document.getElementById('packagesContainer');
        container.innerHTML = '';
        if (product.packages && product.packages.length > 0) {
            product.packages.forEach(pkg => {
                addPackageInput(pkg.label, pkg.price);
            });
        } else {
            addPackageInput();
        }

        document.getElementById('productId').readOnly = true;
        document.getElementById('productModal').classList.add('active');
    });
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        database.ref(`products/${productId}`).remove()
            .then(() => {
                alert('Product deleted successfully!');
                loadProductsList();
            })
            .catch(error => alert('Error: ' + error.message));
    }
}

// Product form submission
document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect packages
            const packages = [];
            document.querySelectorAll('.package-row').forEach(row => {
                const label = row.querySelector('.package-label').value;
                const price = Number(row.querySelector('.package-price').value);
                if (label && price) {
                    packages.push({ label, price });
                }
            });

            if (packages.length === 0) {
                alert('Please add at least one package.');
                return;
            }

            const productData = {
                id: document.getElementById('productId').value,
                name: document.getElementById('productName').value,
                category: document.getElementById('productCategory').value,
                image: document.getElementById('productImage').value,
                description: document.getElementById('productDescription').value,
                requirements: document.getElementById('productRequirements').value,
                packages: packages
            };

            database.ref(`products/${productData.id}`).set(productData)
                .then(() => {
                    alert('Product saved successfully!');
                    closeProductModal();
                    loadProductsList();
                })
                .catch(error => alert('Error: ' + error.message));
        });
    }
});

// ===== ORDERS =====
function loadOrdersList() {
    database.ref('orders').once('value', snapshot => {
        const tbody = document.getElementById('ordersTable');
        tbody.innerHTML = '';

        if (!snapshot.exists()) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No orders yet</td></tr>';
            return;
        }

        const orders = [];
        snapshot.forEach(child => {
            orders.push({ id: child.key, ...child.val() });
        });

        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        orders.forEach(order => {
            const tr = document.createElement('tr');
            // Safe access to properties
            const displayEmail = order.userEmail || 'Guest / Unknown';
            const displayTotal = order.total ? `NPR ${order.total}` : 'NPR 0';
            const itemCount = order.items ? order.items.length : 0;

            tr.innerHTML = `
                <td>${order.id.substring(0, 8)}</td>
                <td>${displayEmail}</td>
                <td>${itemCount} items</td>
                <td>${displayTotal}</td>
                <td>
                    <select onchange="updateOrderStatus('${order.id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-secondary" onclick="viewOrderDetails('${order.id}')">View</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }).catch(error => {
        console.error('Error loading orders:', error);
        const tbody = document.getElementById('ordersTable');
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading orders: ' + error.message + '</td></tr>';
    });
}

function updateOrderStatus(orderId, newStatus) {
    database.ref(`orders/${orderId}/status`).set(newStatus)
        .then(() => alert('Order status updated!'))
        .catch(error => alert('Error: ' + error.message));
}

function viewOrderDetails(orderId) {
    database.ref(`orders/${orderId}`).once('value', snapshot => {
        const order = snapshot.val();
        let details = `Order #${orderId.substring(0, 8)}\n\n`;
        details += `Customer: ${order.userEmail || 'N/A'}\n`;
        details += `Date: ${new Date(order.createdAt).toLocaleString()}\n`;
        details += `Status: ${order.status}\n\n`;

        details += `Items:\n`;
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                details += `- ${item.productName} (${item.package}): NPR ${item.price}\n`;
            });
        } else {
            details += `- No items found (Legacy order)\n`;
        }

        details += `\nTotal: NPR ${order.total || 0}\n\n`;
        details += `Payment Method: ${order.paymentMethod || 'N/A'}\n`;

        if (order.paymentProof) {
            details += `Payment Proof Link: ${order.paymentProof.imgbbLink || 'N/A'}\n`;
            details += `Account Number: ${order.paymentProof.accountNumber || 'N/A'}\n`;
            details += `Transaction ID: ${order.paymentProof.transactionId || 'N/A'}\n\n`;
        } else {
            details += `Payment Proof: Not submitted\n\n`;
        }

        details += `Requirements / Account Details:\n`;
        if (order.requirements) {
            // Check if requirements is a string or object
            if (typeof order.requirements === 'object') {
                for (let key in order.requirements) {
                    // Format key from "requirement_pubg_id" to "Pubg Id" for better readability
                    const readableKey = key.replace('requirement_', '').replace(/_/g, ' ').toUpperCase();
                    details += `${readableKey}: ${order.requirements[key]}\n`;
                }
            } else {
                details += `${order.requirements}\n`;
            }
        } else {
            details += `No specific requirements provided.\n`;
        }

        alert(details);
    });
}

// ===== COUPONS =====
function loadCouponsList() {
    database.ref('coupons').once('value', snapshot => {
        const tbody = document.getElementById('couponsTable');
        tbody.innerHTML = '';

        snapshot.forEach(child => {
            const coupon = child.val();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${coupon.code}</td>
                <td>${coupon.discount}%</td>
                <td>${coupon.active ? '✅ Active' : '❌ Inactive'}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteCoupon('${child.key}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

function showAddCouponModal() {
    document.getElementById('couponForm').reset();
    document.getElementById('couponModal').classList.add('active');
}

function closeCouponModal() {
    document.getElementById('couponModal').classList.remove('active');
}

function deleteCoupon(couponId) {
    if (confirm('Are you sure you want to delete this coupon?')) {
        database.ref(`coupons/${couponId}`).remove()
            .then(() => {
                alert('Coupon deleted!');
                loadCouponsList();
            })
            .catch(error => alert('Error: ' + error.message));
    }
}

// Coupon form submission
document.addEventListener('DOMContentLoaded', () => {
    const couponForm = document.getElementById('couponForm');
    if (couponForm) {
        couponForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const couponData = {
                code: document.getElementById('couponCode').value.toUpperCase(),
                discount: parseInt(document.getElementById('couponDiscount').value),
                active: document.getElementById('couponActive').checked
            };

            database.ref('coupons').push(couponData)
                .then(() => {
                    alert('Coupon created successfully!');
                    closeCouponModal();
                    loadCouponsList();
                })
                .catch(error => alert('Error: ' + error.message));
        });
    }
});

// ===== ANNOUNCEMENTS =====
function loadCurrentAnnouncement() {
    database.ref('announcement').once('value', snapshot => {
        const announcement = snapshot.val();
        if (announcement) {
            document.getElementById('announcementMessage').value = announcement.message || '';
            document.getElementById('announcementActive').checked = announcement.active || false;
        }
    });
}

function saveAnnouncement() {
    const announcementData = {
        message: document.getElementById('announcementMessage').value,
        active: document.getElementById('announcementActive').checked
    };

    database.ref('announcement').set(announcementData)
        .then(() => alert('Announcement saved successfully!'))
        .catch(error => alert('Error: ' + error.message));
}

// ===== BLACK FRIDAY =====
function loadBlackFridayDeals() {
    database.ref('blackFriday').once('value', snapshot => {
        const container = document.getElementById('blackFridayList');
        container.innerHTML = '';

        snapshot.forEach(child => {
            const deal = child.val();
            const div = document.createElement('div');
            div.className = 'card';
            div.style.marginBottom = '1rem';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3>${deal.name} - ${deal.package}</h3>
                        <p class="text-muted">
                            <span style="text-decoration: line-through;">NPR ${deal.originalPrice}</span>
                            <span class="text-danger"> → NPR ${deal.discountedPrice}</span>
                            (Save ${Math.round((1 - deal.discountedPrice / deal.originalPrice) * 100)}%)
                        </p>
                    </div>
                    <button class="btn btn-danger" onclick="deleteBlackFridayDeal('${child.key}')">Delete</button>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

let bfSelectedProduct = null;

function showAddBlackFridayModal() {
    document.getElementById('blackFridayForm').reset();

    // Load products into dropdown
    const select = document.getElementById('bfProductSelect');
    select.innerHTML = '<option value="">-- Loading... --</option>';

    database.ref('products').once('value', snapshot => {
        select.innerHTML = '<option value="">-- Select a Product --</option>';
        snapshot.forEach(child => {
            const product = child.val();
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            // Store full object in data attribute? No, just lookup or fetch.
            // Actually simplest to store map in memory if list is small, or just fetch on change.
            // Let's attach data to element for simplicity
            option.dataset.product = JSON.stringify(product);
            select.appendChild(option);
        });
    });

    document.getElementById('blackFridayModal').classList.add('active');
}

function onBFProductChange() {
    const select = document.getElementById('bfProductSelect');
    const packageSelect = document.getElementById('bfPackageSelect');
    const selectedOption = select.options[select.selectedIndex];

    if (!selectedOption.value) {
        packageSelect.innerHTML = '<option value="">-- First Select Product --</option>';
        return;
    }

    const product = JSON.parse(selectedOption.dataset.product);
    bfSelectedProduct = product;

    // Auto-fill hidden fields
    document.getElementById('bfProductName').value = product.name;
    document.getElementById('bfImage').value = product.image;

    // Populate packages
    packageSelect.innerHTML = '<option value="">-- Select a Package --</option>';
    if (product.packages) {
        product.packages.forEach((pkg, index) => {
            const option = document.createElement('option');
            option.value = index; // Use index to identify
            option.textContent = `${pkg.label} (NPR ${pkg.price})`;
            option.dataset.price = pkg.price;
            option.dataset.label = pkg.label;
            packageSelect.appendChild(option);
        });
    }
}

function onBFPackageChange() {
    const select = document.getElementById('bfPackageSelect');
    const selectedOption = select.options[select.selectedIndex];

    if (selectedOption.value !== "") {
        document.getElementById('bfOriginalPrice').value = selectedOption.dataset.price;
        document.getElementById('bfPackage').value = selectedOption.dataset.label;
    } else {
        document.getElementById('bfOriginalPrice').value = '';
        document.getElementById('bfPackage').value = '';
    }
}

function closeBlackFridayModal() {
    document.getElementById('blackFridayModal').classList.remove('active');
}

function deleteBlackFridayDeal(dealId) {
    if (confirm('Delete this Black Friday deal?')) {
        database.ref(`blackFriday/${dealId}`).remove()
            .then(() => {
                alert('Deal deleted!');
                loadBlackFridayDeals();
            })
            .catch(error => alert('Error: ' + error.message));
    }
}

// Black Friday form submission
document.addEventListener('DOMContentLoaded', () => {
    const bfForm = document.getElementById('blackFridayForm');
    if (bfForm) {
        bfForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const dealData = {
                productId: document.getElementById('bfProductId').value,
                name: document.getElementById('bfProductName').value,
                package: document.getElementById('bfPackage').value,
                image: document.getElementById('bfImage').value,
                originalPrice: parseInt(document.getElementById('bfOriginalPrice').value),
                discountedPrice: parseInt(document.getElementById('bfDiscountedPrice').value)
            };

            database.ref('blackFriday').push(dealData)
                .then(() => {
                    alert('Black Friday deal added!');
                    closeBlackFridayModal();
                    loadBlackFridayDeals();
                })
                .catch(error => alert('Error: ' + error.message));
        });
    }
});

// ===== CHATS =====
function loadChatsList() {
    database.ref('chats').once('value', snapshot => {
        const container = document.getElementById('chatsList');
        container.innerHTML = '';

        if (!snapshot.exists()) {
            container.innerHTML = '<p class="text-center text-muted">No chats yet</p>';
            return;
        }

        snapshot.forEach(child => {
            const chat = child.val();
            const chatId = child.key;
            const metadata = chat.metadata || {};

            const div = document.createElement('div');
            div.className = 'card';
            div.style.marginBottom = '1rem';
            div.innerHTML = `
                <div>
                    <h3>${metadata.userEmail || 'Guest User'}</h3>
                    <p class="text-muted">Last message: ${metadata.lastMessage || 'N/A'}</p>
                    <button class="btn btn-secondary" onclick="viewChat('${chatId}')">View Chat</button>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

function viewChat(chatId) {
    database.ref(`chats/${chatId}/messages`).once('value', snapshot => {
        let chatHistory = '';
        snapshot.forEach(child => {
            const msg = child.val();
            chatHistory += `[${msg.sender}]: ${msg.text}\n`;
        });

        const reply = prompt('Chat History:\n\n' + chatHistory + '\n\nEnter your reply:');
        if (reply) {
            const message = {
                text: reply,
                sender: 'support',
                timestamp: new Date().toISOString(),
                read: false
            };
            database.ref(`chats/${chatId}/messages`).push(message)
                .then(() => alert('Reply sent!'))
                .catch(error => alert('Error: ' + error.message));
        }
    });
}

// Logout
function logoutAdmin() {
    if (confirm('Are you sure you want to logout?')) {
        logoutUser().then(() => {
            window.location.href = 'index.html';
        });
    }
}

// Load dashboard on page load
window.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
});
