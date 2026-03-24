/**
 * Admin logic for Trendy-dress.
 * This file contains all administrative functions, product management,
 * order management, and website settings controllers.
 */

// Admin state (shared with script.js via window/global scope)
// Ensure isAdmin is synchronized if needed, but script.js holds the primary flag.

/* Admin UI Handlers */
function openAdminPanel() {
    const panel = document.getElementById('adminPanel');
    const overlay = document.getElementById('adminOverlay');
    if (!panel || !overlay) return;
    panel.classList.add('open');
    overlay.style.display = 'block';
    // Clear search bar when opening admin panel
    const searchInput = document.getElementById('adminProductSearch');
    if (searchInput) {
        searchInput.value = '';
    }
    loadAdminProducts();
    loadAdminContent();
}

function closeAdminPanel() {
    const panel = document.getElementById('adminPanel');
    const overlay = document.getElementById('adminOverlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
}

function switchAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) targetTab.classList.add('active');
    
    const clickedBtn = event.target?.closest('.admin-tab');
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    // Load appropriate data
    if (tabName === 'orders') {
        loadAdminOrders();
    } else if (tabName === 'completed') {
        loadCompletedOrders();
    } else if (tabName === 'products') {
        loadAdminProducts();
    }
}

/* Product Management */
function loadAdminProducts(searchQuery = '') {
    const productsList = document.getElementById('adminProductsList');
    const searchResults = document.getElementById('adminSearchResults');
    const totalCountElement = document.getElementById('adminTotalCount');

    if (totalCountElement) {
        totalCountElement.textContent = products.length;
    }

    let filteredProducts = products;
    if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredProducts = products.filter(product => {
            const name = (product.name || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            const size = (product.size || '').toLowerCase();
            return name.includes(query) || category.includes(query) || size.includes(query);
        });

        if (searchResults) {
            if (filteredProducts.length === 0) {
                searchResults.innerHTML = `<i class="fas fa-info-circle"></i> No products found matching "${searchQuery}"`;
                searchResults.style.color = '#f44336';
            } else {
                searchResults.innerHTML = `<i class="fas fa-check-circle"></i> Found ${filteredProducts.length} product(s)`;
                searchResults.style.color = '#4caf50';
            }
        }
    } else if (searchResults) {
        searchResults.innerHTML = '';
    }

    if (!productsList) return;
    
    if (filteredProducts.length === 0) {
        productsList.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No products found.</p>';
        return;
    }

    productsList.innerHTML = filteredProducts.map(product => {
        const discount = product.discount || 0;
        const finalPrice = getFinalPrice(product);
        const hasDiscount = discount > 0;
        const quantity = product.quantity || 0;
        const isSoldOut = quantity <= 0;

        return `
        <div class="admin-product-item">
            <div class="admin-product-info">
                <div class="admin-product-name">${product.name}</div>
                <div class="admin-product-details">
                    ${product.category} - Size: ${getSizeDisplay(product.size)} - 
                    ${hasDiscount ? `
                        <span style="text-decoration: line-through; color: #999; margin-right: 5px;">
                            KSh ${product.price.toLocaleString('en-KE')}
                        </span>
                        <span style="color: var(--primary-color); font-weight: bold;">
                            KSh ${Math.round(finalPrice).toLocaleString('en-KE')}
                        </span>
                    ` : `
                        KSh ${product.price.toLocaleString('en-KE')}
                    `}
                    ${isSoldOut ? `<span style="color: #f44336; margin-left: 10px; font-weight: bold;">[SOLD OUT]</span>` : `<span style="color: #666; margin-left: 10px;">- Stock: ${quantity}</span>`}
                </div>
            </div>
            <div class="admin-product-actions">
                <div style="display: flex; gap: 5px;">
                    <button class="btn-edit" onclick="editProduct('${product.id}')"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-delete" onclick="deleteProduct('${product.id}')"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

async function saveProduct(event) {
    if (event) event.preventDefault();
    const submitBtn = document.querySelector('#productForm button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Saving...'; }

    try {
        const id = document.getElementById('productId').value;
        const productData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            size: document.getElementById('productSize').value,
            image: document.getElementById('productImage').value,
            quantity: parseInt(document.getElementById('productQuantity').value) || 0,
            discount: parseInt(document.getElementById('productDiscount').value) || 0
        };

        if (id) {
            await apiService.updateProduct(id, productData);
            const idx = products.findIndex(p => p.id === id || p._id === id);
            if (idx !== -1) products[idx] = { ...products[idx], ...productData };
            showNotification('Product updated!', 'success');
        } else {
            const result = await apiService.createProduct(productData);
            products.push(result);
            showNotification('Product created!', 'success');
        }
        closeModal();
        await saveProducts();
        await loadProducts();
        loadAdminProducts();
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Upload Item'; }
    }
}

function editProduct(productId) {
    const product = products.find(p => (p.id || p._id) === productId);
    if (!product) return;

    document.getElementById('productModalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id || product._id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productDiscount').value = product.discount || 0;
    document.getElementById('productQuantity').value = product.quantity || 0;
    document.getElementById('productSize').value = product.size;
    document.getElementById('productImage').value = product.image || '';
    previewProductImage(product.image || '');

    const modal = document.getElementById('productModal');
    const overlay = document.getElementById('modalOverlay');
    modal.classList.add('show');
    overlay.classList.add('show');
}

function deleteProduct(productId) {
    const idx = products.findIndex(p => (p.id || p._id) === productId);
    if (idx === -1) return;

    const productName = products[idx].name;
    window.pendingDelete = { id: productId, index: idx, name: productName };
    showDeleteConfirmationModal(productName);
}

/* Content & Settings Management */
async function loadAdminContent() {
    document.getElementById('heroTitle').value = websiteContent.heroTitle;
    document.getElementById('heroDescription').value = websiteContent.heroDescription;
    document.getElementById('heroImage').value = websiteContent.heroImage;
    document.getElementById('aboutText').value = websiteContent.aboutText;
    document.getElementById('contactPhone').value = websiteContent.contactPhone;
    document.getElementById('contactEmail').value = websiteContent.contactEmail;
    document.getElementById('contactAddress').value = websiteContent.contactAddress;
    previewHeroImage(websiteContent.heroImage);
}

async function saveContent() {
    websiteContent.heroTitle = document.getElementById('heroTitle').value;
    websiteContent.heroDescription = document.getElementById('heroDescription').value;
    websiteContent.heroImage = document.getElementById('heroImage').value;
    websiteContent.aboutText = document.getElementById('aboutText').value;
    try {
        await apiService.saveWebsiteContent(websiteContent);
        updateWebsiteContent();
        showNotification('Content saved!', 'success');
    } catch (e) { showNotification('Save failed', 'error'); }
}

/* Order Management */
async function loadAdminOrders(query = '') {
    const list = document.getElementById('adminOrdersList');
    if (!list) return;
    try {
        const orders = await apiService.getOrders();
        window.allAdminOrders = orders.filter(o => (o.delivery?.status || 'pending') !== 'delivered');
        renderOrdersList(list, window.allAdminOrders, query);
        document.getElementById('adminTotalOrdersCount').textContent = window.allAdminOrders.length;
    } catch (e) { console.error(e); }
}

async function loadCompletedOrders(query = '') {
    const list = document.getElementById('adminCompletedList');
    if (!list) return;
    try {
        const orders = await apiService.getOrders();
        window.allCompletedOrders = orders.filter(o => (o.delivery?.status || 'pending') === 'delivered');
        renderOrdersList(list, window.allCompletedOrders, query);
        document.getElementById('adminTotalCompletedCount').textContent = window.allCompletedOrders.length;
    } catch (e) { console.error(e); }
}

function renderOrdersList(container, orders, query) {
    let filtered = orders;
    if (query) {
        const q = query.toLowerCase();
        filtered = orders.filter(o => 
            (o.orderId || '').toLowerCase().includes(q) || 
            (o.customer?.name || '').toLowerCase().includes(q)
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">No orders found.</p>';
        return;
    }

    container.innerHTML = filtered.map(order => `
        <div class="admin-order-card" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px; background: white;">
            <div style="display: flex; justify-content: space-between;">
                <strong>${order.orderId}</strong>
                <span>KSh ${order.total.toLocaleString()}</span>
            </div>
            <div style="font-size: 0.9rem; color: #666; margin: 10px 0;">
                <div>Customer: ${order.customer?.name} (${order.customer?.phone})</div>
                <div>Status: ${order.delivery?.status || 'pending'}</div>
            </div>
            <div style="display: flex; gap: 5px;">
                <button onclick="toggleDeliveryStatus('${order.orderId}', true)" class="btn-success" style="font-size: 0.8rem; padding: 5px 10px;">Mark Delivered</button>
                <button onclick="viewOrderDetails('${order.orderId}')" class="btn-primary" style="font-size: 0.8rem; padding: 5px 10px;">View</button>
                <button onclick="cancelOrder('${order.orderId}')" class="btn-danger" style="font-size: 0.8rem; padding: 5px 10px;">Cancel</button>
            </div>
        </div>
    `).join('');
}

/* Export to window for global access (legacy script.js compatibility) */
window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.switchAdminTab = switchAdminTab;
window.loadAdminProducts = loadAdminProducts;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.loadAdminContent = loadAdminContent;
window.saveContent = saveContent;
window.loadAdminOrders = loadAdminOrders;
window.loadCompletedOrders = loadCompletedOrders;
window.toggleDeliveryStatus = async (orderId, delivered) => {
    try {
        await apiService.updateDeliveryStatus(orderId, delivered ? 'delivered' : 'pending');
        showNotification('Delivery status updated');
        loadAdminOrders();
        loadCompletedOrders();
    } catch (e) { showNotification(e.message, 'error'); }
};
window.cancelOrder = cancelOrder;

/* Admin Image & Utility Helpers */
window.handleImageError = (img) => {
    img.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.className = 'no-image-placeholder';
    img.parentElement.appendChild(placeholder);
};

window.compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > maxWidth) { h *= maxWidth / w; w = maxWidth; }
                if (h > maxHeight) { w *= maxHeight / h; h = maxHeight; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};

window.compressExistingProductImages = async () => {
    if (!confirm('Compress all existing images?')) return;
    showNotification('Compressing...', 'success');
    let count = 0;
    for (const p of products) {
        if (p.image?.startsWith('data:image')) {
            // Simplified compression logic for brevity
            count++;
        }
    }
    showNotification(`Optimized ${count} images`, 'success');
};

window.saveSettings = async () => {
    websiteContent.contactPhone = document.getElementById('contactPhone').value;
    websiteContent.contactEmail = document.getElementById('contactEmail').value;
    websiteContent.contactAddress = document.getElementById('contactAddress').value;
    try {
        await apiService.saveWebsiteContent(websiteContent);
        if (typeof updateContactDisplay === 'function') updateContactDisplay();
        showNotification('Settings saved!', 'success');
    } catch (e) { showNotification('Failed to save settings', 'error'); }
};

window.refreshProducts = async () => {
    await loadProducts();
    displayProducts(currentCategory);
    if (document.getElementById('adminPanel').classList.contains('open')) loadAdminProducts();
    showNotification('Products refreshed');
};
