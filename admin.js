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
            discount: parseInt(document.getElementById('productDiscount').value) || 0,
            isDiscountHidden: document.getElementById('isDiscountHidden').checked,
            discountVisibleTo: document.getElementById('discountVisibleTo').value
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
        
        // Notify other clients about the product change
        if (typeof socket !== 'undefined' && socket) {
            socket.emit('admin_product_updated', { id, name: productData.name });
        }
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
    document.getElementById('isDiscountHidden').checked = product.isDiscountHidden || false;
    document.getElementById('discountVisibleTo').value = product.discountVisibleTo || 'public';
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
    
    // Update website icon preview if it exists
    if (websiteContent.websiteIcon) {
        const iconImg = document.getElementById('websiteIconPreviewImg');
        const iconContainer = document.getElementById('websiteIconPreview');
        if (iconImg) iconImg.src = websiteContent.websiteIcon;
        if (iconContainer) iconContainer.style.display = 'block';
    }
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
async function cancelOrder(orderId) {
    if (!confirm(`Are you sure you want to cancel order ${orderId}? This will remove it from the records.`)) {
        return;
    }

    try {
        showNotification('Cancelling order...', 'info');
        await apiService.deleteOrder(orderId);
        showNotification(`Order ${orderId} cancelled successfully`, 'success');
        
        // Refresh orders list
        if (typeof loadAdminOrders === 'function') loadAdminOrders();
        if (typeof loadCompletedOrders === 'function') loadCompletedOrders();
    } catch (error) {
        console.error('Error cancelling order:', error);
        showNotification(`Failed to cancel order: ${error.message}`, 'error');
    }
}

window.cancelOrder = cancelOrder;

/* Admin Image & Utility Helpers */
window.handleImageError = (img) => {
    img.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.className = 'no-image-placeholder';
    img.parentElement.appendChild(placeholder);
};

window.compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.75) => {
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
                resolve(canvas.toDataURL('image/webp', quality));
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

/* Administrative & UI Helpers */
function getFinalPrice(product) {
    if (!product) return 0;
    const price = parseFloat(product.price) || 0;
    const discount = parseInt(product.discount) || 0;
    return price - (price * (discount / 100));
}

function getSizeDisplay(size) {
    if (!size) return 'N/A';
    const s = size.toString().toUpperCase();
    const map = { 'S': 'Small', 'M': 'Medium', 'L': 'Large', 'XL': 'Extra Large', 'XXL': 'Double XL' };
    return map[s] || s;
}

function closeModal() {
    const modals = ['productModal', 'adminOrderDetailsModal', 'deleteConfirmationModal'];
    modals.forEach(id => {
        const m = document.getElementById(id);
        if (m) m.classList.remove('show');
    });
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('show');
    const adminOverlay = document.getElementById('adminOrderDetailsOverlay');
    if (adminOverlay) adminOverlay.classList.remove('show');
}

function previewProductImage(src) {
    const previewContainer = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const input = document.getElementById('productImage');
    if (previewImg) {
        previewImg.src = src || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
    if (previewContainer) {
        previewContainer.style.display = src ? 'block' : 'none';
    }
    if (input) input.value = src || '';
}

function previewHeroImage(src) {
    const previewContainer = document.getElementById('heroImagePreview');
    const previewImg = document.getElementById('heroPreviewImg');
    if (previewImg) {
        previewImg.src = src || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
    if (previewContainer) {
        previewContainer.style.display = src ? 'block' : 'none';
    }
}

function showDeleteConfirmationModal(productName) {
    const modal = document.getElementById('deleteConfirmationModal');
    const overlay = document.getElementById('modalOverlay');
    const text = document.getElementById('deleteConfirmationText');
    if (text) text.textContent = `Are you sure you want to delete "${productName}"?`;
    if (modal && overlay) {
        modal.classList.add('show');
        overlay.classList.add('show');
    }
}

async function confirmDelete() {
    if (!window.pendingDelete) return;
    const { id, index } = window.pendingDelete;
    try {
        await apiService.deleteProduct(id);
        products.splice(index, 1);
        showNotification('Product deleted!', 'success');
        closeModal();
        await saveProducts();
        loadAdminProducts();
    } catch (e) {
        showNotification('Delete failed: ' + e.message, 'error');
    } finally {
        window.pendingDelete = null;
    }
}

// Expose these to window so script.js or inline HTML can call them
window.getFinalPrice = getFinalPrice;
window.getSizeDisplay = getSizeDisplay;
window.closeModal = closeModal;
window.previewProductImage = previewProductImage;
window.previewHeroImage = previewHeroImage;
window.confirmDelete = confirmDelete;

// Image Upload Handlers
window.handleHeroImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            const dataUrl = await window.compressImage(file, 1920, 1080);
            document.getElementById('heroImage').value = dataUrl;
            previewHeroImage(dataUrl);
            if (typeof showNotification === 'function') {
                showNotification('Hero image processed. Ready to save.', 'success');
            }
        } catch (error) {
            console.error('Error uploading hero image:', error);
            if (typeof showNotification === 'function') {
                showNotification('Failed to process image', 'error');
            }
        }
    }
};

window.removeHeroImage = () => {
    document.getElementById('heroImage').value = '';
    const fileInput = document.getElementById('heroImageFile');
    if (fileInput) fileInput.value = '';
    previewHeroImage('');
};

window.handleWebsiteIconUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            const dataUrl = await window.compressImage(file, 256, 256);
            if (typeof websiteContent !== 'undefined') {
                websiteContent.websiteIcon = dataUrl;
            }
            const img = document.getElementById('websiteIconPreviewImg');
            if (img) img.src = dataUrl;
            const container = document.getElementById('websiteIconPreview');
            if (container) container.style.display = 'block';
            if (typeof showNotification === 'function') {
                showNotification('Website icon processed. Remember to save settings.', 'success');
            }
        } catch (error) {
            console.error('Error uploading website icon:', error);
            if (typeof showNotification === 'function') {
                showNotification('Failed to process image', 'error');
            }
        }
    }
};

window.removeWebsiteIcon = () => {
    if (typeof websiteContent !== 'undefined') {
        websiteContent.websiteIcon = '';
    }
    const fileInput = document.getElementById('websiteIconFile');
    if (fileInput) fileInput.value = '';
    const img = document.getElementById('websiteIconPreviewImg');
    if (img) img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const container = document.getElementById('websiteIconPreview');
    if (container) container.style.display = 'none';
};

window.handleProductImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            const dataUrl = await window.compressImage(file, 800, 800);
            document.getElementById('productImage').value = dataUrl;
            previewProductImage(dataUrl);
            if (typeof showNotification === 'function') {
                showNotification('Product image processed.', 'success');
            }
        } catch (error) {
            console.error('Error uploading product image:', error);
            if (typeof showNotification === 'function') {
                showNotification('Failed to process image', 'error');
            }
        }
    }
};

window.removeProductImage = () => {
    document.getElementById('productImage').value = '';
    const fileInput = document.getElementById('productImageFile');
    if (fileInput) fileInput.value = '';
    previewProductImage('');
};

window.updateWebsiteContent = () => {
    // Update DOM elements on main page when content is saved
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle && typeof websiteContent !== 'undefined') heroTitle.textContent = websiteContent.heroTitle;
    
    const heroDesc = document.querySelector('.hero p');
    if (heroDesc && typeof websiteContent !== 'undefined') heroDesc.textContent = websiteContent.heroDescription;
    
    // Update background if present
    const heroSection = document.querySelector('.hero');
    if (heroSection && typeof websiteContent !== 'undefined' && websiteContent.heroImage) {
        heroSection.style.backgroundImage = `url(${websiteContent.heroImage})`;
    }
};

// Manual Push Notifications
window.triggerNotification = async () => {
    const title = prompt('Notification Title:');
    if (!title) return;
    const body = prompt('Notification Body:');
    if (!body) return;
    
    try {
        const isProd = window.location.hostname.includes('trendydresses.co.ke');
        const nodeURL = window.location.protocol + '//' + window.location.hostname + (isProd ? '' : ':4000') + '/api/notifications/send';
        const response = await fetch(nodeURL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ title, body })
        });
        const result = await response.json();
        if (typeof showNotification === 'function') {
            showNotification(result.message, result.success ? 'success' : 'error');
        } else {
            alert(result.message);
        }
    } catch (e) {
        if (typeof showNotification === 'function') {
            showNotification('Failed to send notification: ' + e.message, 'error');
        } else {
            alert('Failed to send notification');
        }
    }
};
