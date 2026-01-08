// Direct Buy Shop functionality - No cart, immediate purchase
let allProducts = [];
let currentCategory = 'All';

// Initialize shop
function initShop() {
    getAllProducts(products => {
        allProducts = products;
        displayProducts(products);
    });

    // Set up filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            filterProducts();
        });
    });

    // Set up search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
}

// Display products
function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card card';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="text-muted">${product.description}</p>
            <p class="price">From NPR ${product.packages[0].price}</p>
            <button class="btn btn-primary buy-now-btn" data-id="${product.id}">Buy Now</button>
        `;
        grid.appendChild(card);
    });

    // Add event delegation for "Buy Now" buttons if not already added
    if (!grid.hasAttribute('data-listeners-added')) {
        grid.addEventListener('click', function (e) {
            if (e.target.classList.contains('buy-now-btn')) {
                const productId = e.target.getAttribute('data-id');
                buyNow(productId);
            }
        });
        grid.setAttribute('data-listeners-added', 'true');
    }
}

// Filter products
function filterProducts() {
    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();

    let filtered = allProducts;

    // Filter by category
    if (currentCategory !== 'All') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }

    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }

    displayProducts(filtered);
}

// Buy Now - Direct purchase
function buyNow(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('productModal');
    const details = document.getElementById('productDetails');

    let packagesHTML = '';
    product.packages.forEach((pkg, index) => {
        packagesHTML += `
            <div class="card package-option" data-product-id="${product.id}" data-package-index="${index}" style="margin-bottom: 0.5rem; cursor: pointer;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${pkg.label}</strong>
                    <span class="text-primary">NPR ${pkg.price}</span>
                </div>
            </div>
        `;
    });

    details.innerHTML = `
        <img src="${product.image}" alt="${product.name}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: var(--border-radius); margin-bottom: 1rem;">
        <h2>${product.name}</h2>
        <p>${product.description}</p>
        <p class="text-muted">Requirements: ${product.requirements}</p>
        <h3 class="mt-3">Select Package:</h3>
        ${packagesHTML}
    `;

    modal.classList.add('active');

    // Add click event listeners to package options
    const packageOptions = details.querySelectorAll('.package-option');
    packageOptions.forEach(option => {
        option.addEventListener('click', function () {
            const prodId = this.getAttribute('data-product-id');
            const pkgIndex = parseInt(this.getAttribute('data-package-index'));
            proceedToBuy(prodId, pkgIndex);
        });
    });
}

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

// Proceed to buy - go directly to checkout
function proceedToBuy(productId, packageIndex) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const pkg = product.packages[packageIndex];

    // Create single-item cart
    const orderItem = {
        productId: product.id,
        productName: product.name,
        package: pkg.label,
        price: pkg.price,
        requirements: product.requirements,
        image: product.image
    };

    // Save to localStorage and redirect
    localStorage.setItem('directBuyItem', JSON.stringify(orderItem));

    // Check if user is logged in
    onAuthStateChanged(user => {
        if (!user) {
            if (confirm('Please login to continue with purchase. Would you like to login now?')) {
                window.location.href = 'login.html';
            }
        } else {
            window.location.href = 'checkout.html';
        }
    });

    closeProductModal();
}
