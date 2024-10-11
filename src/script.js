let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
cart = cart.map(item => ({ ...item, checked: true }));
let categories = [];
let currentPage = 1;
let itemsPerPage = 10;

const ITEMS_PER_PAGE = 5;
const productList = document.getElementById('productList');
const categoryFilter = document.getElementById('categoryFilter');
const itemsPerPageSelect = document.getElementById('itemsPerPage');
const cartContainer = document.getElementById('cartContainer');
const cartIcon = document.getElementById('cartIcon');
const cartDiv = document.getElementById('cart');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartItemCount = document.getElementById('cartItemCount');
const totalItems = document.getElementById('totalItems');
const totalPrice = document.getElementById('totalPrice');
const checkoutBtn = document.getElementById('checkoutBtn');
const errorDiv = document.getElementById('error');
const paginationDiv = document.getElementById('pagination');

// Fetch products from API
async function fetchProducts() {
    try {
        const response = await fetch('https://dummyjson.com/products');
        const data = await response.json();
        products = data.products;
        categories = [...new Set(products.map(product => product.category))];
        updateCategoryFilter();
        displayProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
        if (errorDiv) errorDiv.classList.remove('hidden');
    }
}

// Update category filter options
function updateCategoryFilter() {
    if (categoryFilter) {
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
}

// Display products
function displayProducts() {
    if (!productList) return;

    const filteredProducts = products.filter(product => 
        categoryFilter.value === '' || product.category === categoryFilter.value
    );

    productList.innerHTML = '';
    const productsToShow = itemsPerPage === 'all' 
        ? filteredProducts 
        : filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    productsToShow.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.innerHTML = `
            <img src="${product.thumbnail}" alt="${product.title}" class="product-image">
            <h3>${product.title}</h3>
            <p>$${product.price}</p>
            <button onclick="addToCart(${product.id})">Add to Cart</button>
        `;
        productList.appendChild(productDiv);
    });

    updatePagination(filteredProducts.length);
}

function updatePagination(totalProducts) {
    if (!paginationDiv) return;

    paginationDiv.innerHTML = '';

    if (itemsPerPage !== 'all') {
        const totalPages = Math.ceil(totalProducts / itemsPerPage);

        if (totalPages > 1) {
            const prevButton = document.createElement('button');
            prevButton.textContent = 'Previous';
            prevButton.onclick = () => {
                if (currentPage > 1) {
                    currentPage--;
                    displayProducts();
                }
            };
            paginationDiv.appendChild(prevButton);

            const pageInfo = document.createElement('span');
            pageInfo.textContent = `${currentPage} / ${totalPages}`;
            paginationDiv.appendChild(pageInfo);

            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next';
            nextButton.onclick = () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    displayProducts();
                }
            };
            paginationDiv.appendChild(nextButton);
        }
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.id === productId);

    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1, checked: true });
    }

    updateCart();
    if (cartDiv) cartDiv.classList.remove('hidden');
}

function updateCart() {
    if (!cartItems) return;

    cartItems.innerHTML = '';

    cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <input type="checkbox" id="checkbox-${item.id}" ${item.checked ? 'checked' : ''}>
            <img src="${item.thumbnail}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-details">
                <p>${item.title}</p>
                <p>${item.quantity}x $${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-item-actions">
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                <button onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
        cartItems.appendChild(itemDiv);

        const checkbox = itemDiv.querySelector(`#checkbox-${item.id}`);
        checkbox.addEventListener('change', () => {
            item.checked = checkbox.checked;
            updateTotals();
        });
    });

    updateTotals();
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

// Update cart
function updateCart() {
    if (!cartItems) return;

    cartItems.innerHTML = '';
    let totalQuantity = 0;
    let totalCartPrice = 0;

    cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <input type="checkbox" id="checkbox-${item.id}" ${item.checked ? 'checked' : ''}>
            <img src="${item.thumbnail}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-details">
                <p>${item.title}</p>
                <p>${item.quantity}x 
                   <span class="cart-item-price">$${item.price.toFixed(2)}</span>
                </p>
            </div>
            <div class="cart-item-actions">
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                <button onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
        cartItems.appendChild(itemDiv);

        const checkbox = itemDiv.querySelector(`#checkbox-${item.id}`);
        checkbox.addEventListener('change', () => {
            item.checked = checkbox.checked;
            updateTotals();
        });

        if (item.checked) {
            totalQuantity += item.quantity;
            totalCartPrice += item.price * item.quantity;
        }
    });

    updateTotals();
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateQuantity(productId, change) {
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += change;
        if (cartItem.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCart();
        }
    }
}

function updateTotals() {
    const totalQuantity = cart.reduce((sum, item) => item.checked ? sum + item.quantity : sum, 0);
    const totalCartPrice = cart.reduce((sum, item) => item.checked ? sum + (item.price * item.quantity) : sum, 0);

    if (totalItems) totalItems.textContent = totalQuantity;
    if (totalPrice) totalPrice.textContent = totalCartPrice.toFixed(2);
    if (cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartItemCount) cartItemCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Event listeners
if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
        currentPage = 1;
        displayProducts();
    });
}

if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
        currentPage = 1;
        displayProducts();
    });
}

if (cartContainer) {
    cartContainer.addEventListener('mouseenter', () => {
        if (cartDiv) cartDiv.classList.remove('hidden');
    });
    cartContainer.addEventListener('mouseleave', () => {
        if (cartDiv) cartDiv.classList.add('hidden');
    });
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', checkout);
}

function checkout() {
    const checkedItems = cart.filter(item => item.checked);
    const totalBill = checkedItems.reduce((total, item) => total + item.price * item.quantity, 0);

    if (checkedItems.length > 0) {
        alert(`Total Bill is $${totalBill.toFixed(2)}\nThank you for your purchase!`);
        cart = cart.filter(item => !item.checked);
        updateCart();
    } else {
        alert("Please select items to checkout.");
    }
}

// Initialize
fetchProducts();
updateCart();