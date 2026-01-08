// Products Data Structure
const productsData = [
    {
        id: "pubg",
        name: "PUBG Mobile UC",
        category: "Mobile Games",
        image: "images/pubg.png",
        description: "PUBG Mobile Unknown Cash (UC) - Instant delivery via in-game ID",
        requirements: "UID, IGN",
        packages: [
            { label: "60 UC", price: 180 },
            { label: "120 UC", price: 345 },
            { label: "180 UC", price: 520 },
            { label: "325 UC", price: 850 },
            { label: "385 UC", price: 990 },
            { label: "660 UC", price: 1585 },
            { label: "720 UC", price: 1765 },
            { label: "985 UC", price: 2370 },
            { label: "1800 UC", price: 3955 }
        ]
    },
    {
        id: "freefire",
        name: "Free Fire Diamonds",
        category: "Mobile Games",
        image: "images/freefire.png",
        description: "Free Fire Diamonds - Instant delivery via in-game ID",
        requirements: "UID",
        packages: [
            { label: "115 Diamonds", price: 170 },
            { label: "240 Diamonds", price: 250 },
            { label: "610 Diamonds", price: 660 },
            { label: "1240 Diamonds", price: 1210 }
        ]
    },
    {
        id: "steam",
        name: "Steam Gift Cards",
        category: "Gift Cards",
        image: "images/steam.png",
        description: "Steam Wallet Gift Cards - Digital code delivery via email",
        requirements: "Email",
        packages: [
            { label: "2 USD", price: 555 },
            { label: "5 USD", price: 950 },
            { label: "10 USD", price: 1835 },
            { label: "15 USD", price: 2750 },
            { label: "20 USD", price: 3600 }
        ]
    },
    {
        id: "itunes",
        name: "iTunes Gift Cards",
        category: "Gift Cards",
        image: "images/itunes.png",
        description: "iTunes & App Store Gift Cards - Digital code delivery",
        requirements: "Email",
        packages: [
            { label: "5 USD", price: 855 },
            { label: "10 USD", price: 1710 },
            { label: "20 USD", price: 3445 }
        ]
    },
    {
        id: "spotify",
        name: "Spotify Premium",
        category: "Subscriptions",
        image: "images/spotify.png",
        description: "Spotify Premium Subscription - Account upgrade",
        requirements: "Email",
        packages: [
            { label: "Individual 12 Months", price: 3340 }
        ]
    },
    {
        id: "discord",
        name: "Discord Nitro",
        category: "Subscriptions",
        image: "images/discord.png",
        description: "Discord Nitro & Nitro Basic - Account upgrade",
        requirements: "Email",
        packages: [
            { label: "Basic 1 Month", price: 615 },
            { label: "Basic 12 Months", price: 5540 },
            { label: "Nitro (w/ Boosts) 1 Month", price: 1700 },
            { label: "Nitro (w/ Boosts) 1 Year", price: 16430 }
        ]
    },
    {
        id: "minecraft",
        name: "Minecraft",
        category: "Games",
        image: "images/minecraft.png",
        description: "Minecraft Java Edition - Steam key delivery via email",
        requirements: "Microsoft ID, Microsoft Password",
        packages: [
            { label: "Standard Edition", price: 4240 }
        ]
    },
    {
        id: "gtav",
        name: "GTA V",
        category: "Games",
        image: "images/gta.png",
        description: "Grand Theft Auto V - Steam key delivery via email",
        requirements: "Email",
        packages: [
            { label: "Standard Edition", price: 2599 },
            { label: "Premium Edition", price: 2699 }
        ]
    },
    {
        id: "godofwar",
        name: "God of War",
        category: "Games",
        image: "images/godofwar.png",
        packages: [
            { label: "Steam Key", price: 6360 }
        ]
    }
];

// Function to sync products to Firebase
function syncProductsToFirebase() {
    if (!database) {
        console.error("Firebase database not initialized");
        return;
    }

    const productsRef = database.ref('products');

    productsData.forEach(product => {
        productsRef.child(product.id).set(product)
            .then(() => console.log(`Product ${product.name} synced`))
            .catch(error => console.error(`Error syncing ${product.name}:`, error));
    });
}

// Function to get all products from Firebase
function getAllProducts(callback) {
    const productsRef = database.ref('products');
    productsRef.once('value')
        .then(snapshot => {
            const products = [];
            snapshot.forEach(child => {
                products.push(child.val());
            });
            callback(products);
        })
        .catch(error => console.error("Error fetching products:", error));
}

// Function to get product by ID
function getProductById(productId, callback) {
    const productRef = database.ref(`products/${productId}`);
    productRef.once('value')
        .then(snapshot => callback(snapshot.val()))
        .catch(error => console.error("Error fetching product:", error));
}

// Function to get products by category
function getProductsByCategory(category, callback) {
    const productsRef = database.ref('products');
    productsRef.orderByChild('category').equalTo(category).once('value')
        .then(snapshot => {
            const products = [];
            snapshot.forEach(child => {
                products.push(child.val());
            });
            callback(products);
        })
        .catch(error => console.error("Error fetching products:", error));
}
