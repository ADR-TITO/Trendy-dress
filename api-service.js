// API Service for MariaDB Backend
// Auto-detect backend URL and port based on current domain and server response
let detectedBackendURL = null;
let isDetectingPort = false;

// Auto-detect PHP backend
async function detectBackendPort() {
    // Check if running on production domain
    if (window.location.hostname === 'trendydresses.co.ke' ||
        window.location.hostname === 'www.trendydresses.co.ke') {
        // Production: Try different possible paths
        // Option 1: /backend-php/api (most common for cPanel)
        // Option 2: /api (if configured in root)
        const possiblePaths = ['/backend-php/api', '/api'];

        for (const path of possiblePaths) {
            try {
                const testURL = window.location.origin + path + '/health';
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1000);

                const response = await fetch(testURL, {
                    signal: controller.signal,
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    console.log(`✅ Detected PHP backend at: ${window.location.origin}${path}`);
                    return window.location.origin + path;
                }
            } catch (error) {
                // Try next path
                continue;
            }
        }

        // Fallback: Use /backend-php/api (most common for cPanel)
        console.warn('⚠️ Could not auto-detect backend path, using /backend-php/api');
        return window.location.origin + '/backend-php/api';
    }

    // Development: Try PHP backend (port 8000 first, then 80)
    // PHP built-in server typically runs on port 8000 (no admin required)
    // Port 80 requires admin privileges and is usually for production web servers
    const phpPorts = [8000, 80];

    // Try PHP backend ports
    for (const port of phpPorts) {
        try {
            const testURL = `http://localhost:${port}/api/server-info`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 500);

            const response = await fetch(testURL, {
                signal: controller.signal,
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const serverInfo = await response.json();
                const detectedURL = serverInfo.baseURL || `http://localhost:${port}/api`;
                console.log(`✅ Detected PHP backend on port ${port}`);
                return detectedURL;
            }
        } catch (error) {
            // Port not available, try next one
            continue;
        }
    }

    // Fallback: Use PHP default port (8000 for development, 80 for production)
    console.warn('⚠️ Could not auto-detect PHP backend, using default port 8000');
    return 'http://localhost:8000/api';
}

// Initialize backend URL
const getBackendURL = async () => {
    if (detectedBackendURL) {
        return detectedBackendURL;
    }

    if (isDetectingPort) {
        // Wait for ongoing detection
        while (isDetectingPort) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return detectedBackendURL || 'http://localhost:8000/api'; // PHP default (development)
    }

    isDetectingPort = true;
    try {
        detectedBackendURL = await detectBackendPort();
        console.log('🔍 API Service initialized');
        console.log('   Current domain:', window.location.hostname);
        console.log('   Detected backend URL:', detectedBackendURL);
        return detectedBackendURL;
    } catch (error) {
        console.error('❌ Error detecting backend port:', error);
        return 'http://localhost:8000/api'; // PHP default (development)
    } finally {
        isDetectingPort = false;
    }
};

// Initialize with default URL (will be updated after detection)
// PHP backend on same domain in production, port 8000 in development
let API_BASE_URL = (window.location.hostname === 'trendydresses.co.ke' ||
    window.location.hostname === 'www.trendydresses.co.ke')
    ? window.location.origin + '/backend-php/api'  // PHP backend in backend-php folder (cPanel default)
    : 'http://localhost:8000/api';  // PHP default port (8000 for development)

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.initialized = false;

        // Auto-detect and update port in background
        this.initializePort().catch(err => {
            console.warn('⚠️ Port auto-detection failed, using default:', err);
        });
    }

    async initializePort() {
        try {
            const detectedURL = await getBackendURL();
            if (detectedURL !== this.baseURL) {
                this.baseURL = detectedURL;
                console.log('📡 ApiService baseURL updated:', this.baseURL);
            }
            this.initialized = true;
        } catch (error) {
            console.error('❌ Failed to initialize port:', error);
            this.initialized = true; // Mark as initialized even if detection failed
        }
    }

    // Ensure port is detected before making requests
    async ensureInitialized() {
        if (!this.initialized && !isDetectingPort) {
            await this.initializePort();
        }
        // Wait a bit if detection is in progress
        let attempts = 0;
        while (!this.initialized && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }

    // Check if backend is available
    async checkBackend() {
        await this.ensureInitialized();

        try {
            // Optimized timeout - faster response
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

            const response = await fetch(`${this.baseURL}/health`, {
                signal: controller.signal,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });
            clearTimeout(timeoutId);
            const isAvailable = response.ok;

            // If check succeeds and we haven't detected port yet, try to get server info
            if (isAvailable && !this.initialized) {
                try {
                    const serverInfoResponse = await fetch(`${this.baseURL}/server-info`, {
                        signal: controller.signal,
                        headers: { 'Accept': 'application/json' }
                    });
                    if (serverInfoResponse.ok) {
                        const serverInfo = await serverInfoResponse.json();
                        if (serverInfo.baseURL && serverInfo.baseURL !== this.baseURL) {
                            this.baseURL = serverInfo.baseURL;
                            console.log('📡 Updated baseURL from server-info:', this.baseURL);
                        }
                        // Log backend type
                        if (serverInfo.backend) {
                            console.log(`📡 Backend type: ${serverInfo.backend}`);
                        }
                    }
                } catch (e) {
                    // Ignore server-info errors
                }
            }

            if (isAvailable) {
                console.log(`🔍 Backend check: ✅ Available (${response.status})`);
            } else {
                console.log(`🔍 Backend check: ❌ Not available (${response.status})`);
            }
            return isAvailable;
        } catch (error) {
            // Log the error for debugging
            const errorName = error.name || '';
            const errorMsg = error.message || '';
            const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
            const timeoutDuration = (window.location.hostname === 'trendydresses.co.ke' ||
                window.location.hostname === 'www.trendydresses.co.ke')
                ? 5000  // 5 seconds for production
                : 3000; // 3 seconds for local development

            if (errorName === 'AbortError' || errorMsg.includes('aborted')) {
                const timeoutMsg = `${timeoutDuration / 1000}s`;
                console.warn(`⚠️ Backend check timed out (${timeoutMsg}) - may not be available`);
                if (isLocal) {
                    console.warn('💡 Local development tip: Start PHP backend with:');
                    console.warn('   cd backend-php');
                    console.warn('   php -S localhost:8000 -t .');
                    console.warn('   Or run: START_LOCAL.bat (Windows) or START_LOCAL.ps1');
                }
            } else if (errorName === 'TypeError' || errorMsg.includes('fetch')) {
                console.warn('⚠️ Backend check failed - network error or CORS issue');
                if (isLocal) {
                    console.warn('💡 Make sure PHP backend is running on http://localhost:8000');
                    console.warn('   Start with: cd backend-php && php -S localhost:8000 -t .');
                }
            } else {
                console.warn('⚠️ Backend check failed:', error.message);
            }

            return false;
        }
    }

    // Check Database connection status
    async checkDatabaseStatus() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // Optimized timeout to 2 seconds

            const response = await fetch(`${this.baseURL}/db-status`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                },
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Failed to get DB status: ${response.status} ${response.statusText}`);
            }

            const status = await response.json();
            console.log(`🔍 Database status check: ${status.readyStateText || 'unknown'} (ReadyState: ${status.readyState || 0})`);
            return status;
        } catch (error) {
            // Handle errors gracefully
            const errorName = error.name || '';
            const errorMsg = error.message || '';

            if (errorName === 'AbortError' || errorMsg.includes('aborted')) {
                console.warn('⚠️ Database status check timed out (5s)');
                return { readyState: 0, readyStateText: 'timeout', error: 'Status check timed out' };
            } else if (errorName === 'TypeError' || errorMsg.includes('fetch')) {
                console.warn('⚠️ Database status check failed - network error');
                return { readyState: 0, readyStateText: 'network error', error: 'Network error or CORS issue' };
            } else {
                console.warn('⚠️ Database status check failed:', errorMsg);
                return { readyState: 0, readyStateText: 'error', error: errorMsg };
            }
        }
    }

    // Get all products (now includes images by default for proper display)
    async getProducts(category = 'all', includeImages = true, retryCount = 0) {
        await this.ensureInitialized();
        const maxRetries = 2; // Retry up to 2 times (3 total attempts)

        try {
            // Include images by default so products display correctly
            const url = category && category !== 'all'
                ? `${this.baseURL}/products?category=${category}${includeImages ? '&includeImages=true' : '&includeImages=false'}`
                : `${this.baseURL}/products${includeImages ? '?includeImages=true' : '?includeImages=false'}`;

            // Optimized timeouts - reduced for faster failure detection
            // Products without images should load quickly (< 5s)
            const timeoutDuration = includeImages ? 15000 : 5000; // 15s with images, 5s without
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

            if (retryCount > 0) {
                console.log(`📡 Retrying product fetch (attempt ${retryCount + 1}/${maxRetries + 1})...`);
            } else {
                console.log(`📡 Fetching products from Database API (${includeImages ? 'with' : 'without'} images, timeout: ${timeoutDuration / 1000}s)...`);
            }

            let response;
            try {
                response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                clearTimeout(timeoutId);
            } catch (fetchError) {
                clearTimeout(timeoutId);
                // Check if it was aborted due to timeout
                if (fetchError.name === 'AbortError' || fetchError.message.includes('aborted')) {
                    // Retry on timeout if we haven't exceeded max retries
                    if (retryCount < maxRetries) {
                        console.warn(`⚠️ Request timed out, retrying in 1 second... (attempt ${retryCount + 1}/${maxRetries + 1})`);
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                        return this.getProducts(category, includeImages, retryCount + 1);
                    }
                    throw new Error(`Request timed out after ${timeoutDuration / 1000} seconds (${retryCount + 1} attempts)`);
                }
                throw fetchError;
            }

            console.log(`📡 Response received: ${response.status} ${response.statusText}`);
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
                const sizeMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(2);
                const sizeKB = (parseInt(contentLength) / 1024).toFixed(2);
                if (parseInt(contentLength) > 1024 * 1024) {
                    console.log(`📦 Response size: ${sizeMB} MB`);
                } else {
                    console.log(`📦 Response size: ${sizeKB} KB (optimized - no images)`);
                }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 503) {
                    throw new Error(errorData.message || 'Database database is not connected. Please check Database Atlas IP whitelist.');
                }
                throw new Error(errorData.error || 'Failed to fetch products');
            }
            const products = await response.json();
            console.log(`✅ Successfully loaded ${products.length} products from Database API`);
            return products;
        } catch (error) {
            // Log error details for debugging
            const errorName = error.name || '';
            const errorMsg = error.message || '';

            if (errorName === 'AbortError' || errorMsg.includes('timed out') || errorMsg.includes('aborted')) {
                const timeoutMsg = errorMsg.includes('timed out') ? errorMsg.match(/\d+ seconds?/)?.[0] || '20 seconds' : '20 seconds';
                const attemptsMsg = errorMsg.includes('attempts') ? errorMsg.match(/\(\d+ attempts\)/)?.[0] || '' : '';
                console.warn(`⚠️ Product fetch timed out (${timeoutMsg})${attemptsMsg ? ' ' + attemptsMsg : ''} - backend may be slow or network connection is slow`);
                console.warn(`   Tip: ${includeImages ? 'Products with images can be large. ' : ''}The request will automatically retry or fall back to local storage.`);
                console.warn(`   Backend URL: ${this.baseURL}`);
                console.warn(`   You can check backend status at: ${this.baseURL.replace('/products', '/health')}`);
            } else if (errorName === 'TypeError' || errorMsg.includes('fetch') || errorMsg.includes('network')) {
                console.warn(`⚠️ Product fetch failed - network error or CORS issue`);
                console.warn(`   Check if backend is running on ${this.baseURL}`);
                console.warn(`   Test backend health: ${this.baseURL.replace('/products', '/health')}`);
            } else {
                console.error('❌ Error fetching products from API:', errorMsg);
            }

            // Re-throw error so caller can handle fallback
            throw error;
        }
    }

    // Get single product by ID
    async getProduct(id) {
        try {
            const response = await fetch(`${this.baseURL}/products/${id}`);
            if (!response.ok) throw new Error('Failed to fetch product');
            return await response.json();
        } catch (error) {
            console.error('Error fetching product from API:', error);
            throw error;
        }
    }

    // Create new product
    async createProduct(product) {
        try {
            const response = await fetch(`${this.baseURL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(product)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: Failed to create product`;

                if (response.status === 503) {
                    throw new Error('Database not connected: ' + errorMessage);
                }
                throw new Error(errorMessage);
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating product via API:', error);
            throw error;
        }
    }

    // Update product
    async updateProduct(id, product) {
        try {
            const response = await fetch(`${this.baseURL}/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(product)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update product');
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating product via API:', error);
            throw error;
        }
    }

    // Delete product
    async deleteProduct(id) {
        try {
            const response = await fetch(`${this.baseURL}/products/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete product');
            }
            return await response.json();
        } catch (error) {
            console.error('Error deleting product via API:', error);
            throw error;
        }
    }

    // Update product quantity
    async updateQuantity(id, quantity) {
        try {
            const response = await fetch(`${this.baseURL}/products/${id}/quantity`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quantity })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update quantity');
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating quantity via API:', error);
            throw error;
        }
    }

    // Verify M-Pesa transaction code
    async verifyMpesaCode(mpesaCode, amount, transactionDate) {
        try {
            const response = await fetch(`${this.baseURL}/orders/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mpesaCode,
                    amount: amount || 0, // Always send amount (required for verification)
                    transactionDate: transactionDate || new Date()
                })
            });

            // Always try to parse JSON, even if response is not ok
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                // If it's a 400 error with a valid response structure, return it (might be duplicate/invalid format)
                if (response.status === 400 && (data.valid !== undefined || data.reason)) {
                    return data;
                }
                throw new Error(data.error || data.message || 'Failed to verify M-Pesa code');
            }

            return data;
        } catch (error) {
            console.error('Error verifying M-Pesa code:', error);
            // CRITICAL SECURITY: Always throw errors - don't allow payment without verification
            // The frontend will handle the error and block the payment
            throw error;
        }
    }

    // Create order with verification
    async createOrder(orderData) {
        try {
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });
            if (!response.ok) {
                const error = await response.json();
                // Preserve error message for amount mismatch, date mismatch, and duplicate errors
                const errorMessage = error.error || error.message || 'Failed to create order';
                const errorWithDetails = new Error(errorMessage);
                // Preserve error details for better error handling
                if (error.amountMatch === false) {
                    errorWithDetails.amountMismatch = true;
                }
                if (error.dateValid === false) {
                    errorWithDetails.dateMismatch = true;
                }
                if (error.reason === 'duplicate') {
                    errorWithDetails.duplicate = true;
                }
                throw errorWithDetails;
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating order via API:', error);
            throw error;
        }
    }

    // Get all orders from Database
    async getOrders() {
        try {
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || error.message || 'Failed to get orders');
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting orders via API:', error);
            throw error;
        }
    }

    // Initiate STK Push (M-Pesa Prompt) payment
    async initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
        try {
            const response = await fetch(`${this.baseURL}/mpesa/stk-push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber,
                    amount,
                    accountReference: accountReference || 'TrendyDresses',
                    transactionDesc: transactionDesc || 'Payment for order'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || error.message || 'Failed to initiate M-Pesa payment prompt');
            }

            return await response.json();
        } catch (error) {
            console.error('Error initiating STK Push:', error);
            throw error;
        }
    }

    // Query STK Push status
    async querySTKPushStatus(checkoutRequestID) {
        try {
            const response = await fetch(`${this.baseURL}/mpesa/stk-push-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    checkoutRequestID
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || error.message || 'Failed to query STK Push status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error querying STK Push status:', error);
            throw error;
        }
    }

    // Update delivery status
    async updateDeliveryStatus(orderId, deliveryStatus, deliveredBy = null) {
        try {
            const response = await fetch(`${this.baseURL}/orders/${orderId}/delivery-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deliveryStatus,
                    deliveredBy: deliveredBy || 'admin'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || error.message || 'Failed to update delivery status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating delivery status:', error);
            throw error;
        }
    }

    // Send receipt to WhatsApp via backend (with PDF)
    async sendReceiptToWhatsApp(order, pdfBlob) {
        try {
            // Convert PDF blob to base64 for sending
            let pdfBase64 = null;
            if (pdfBlob) {
                try {
                    pdfBase64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            // Remove data URL prefix, keep only base64
                            const base64 = reader.result.split(',')[1];
                            resolve(base64);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(pdfBlob);
                    });
                } catch (pdfError) {
                    console.error('Error converting PDF to base64:', pdfError);
                    // Continue without PDF if conversion fails
                }
            }

            const response = await fetch(`${this.baseURL}/orders/${order.orderId}/send-whatsapp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...order,
                    pdfBase64: pdfBase64,
                    pdfFileName: `Receipt_${order.orderId}.pdf`
                })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || error.message || 'Failed to send receipt to WhatsApp');
            }
            return await response.json();
        } catch (error) {
            console.error('Error sending receipt to WhatsApp via API:', error);
            throw error;
        }
    }

    // Login
    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Logout
    async logout() {
        try {
            const response = await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Logout failed');
            }

            return data;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    // Check admin auth status
    async checkAuth() {
        try {
            const response = await fetch(`${this.baseURL}/auth/check`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                return { authenticated: false };
            }

            return await response.json();
        } catch (error) {
            console.error('Auth check error:', error);
            return { authenticated: false };
        }
    }

    // Change admin credentials
    async changeCredentials(currentPassword, newUsername, newPassword) {
        try {
            const response = await fetch(`${this.baseURL}/auth/change-credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newUsername,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to update credentials');
            }

            return data;
        } catch (error) {
            console.error('Error changing credentials:', error);
            throw error;
        }
    }
}

// Create global API service instance
const apiService = new ApiService();


