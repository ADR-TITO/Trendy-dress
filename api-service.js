// API Service for MongoDB Backend
const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Check if backend is available
    async checkBackend() {
        try {
            // Use a shorter timeout to avoid hanging
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
            return response.ok;
        } catch (error) {
            // Silently handle network errors when backend is not available
            // This is expected when running without backend (using localStorage only)
            if (error.name === 'AbortError' || error.name === 'TypeError' || error.message?.includes('fetch')) {
                // Backend is not available - this is normal when using localStorage
                return false;
            }
            // Only log unexpected errors
            console.warn('Backend check failed:', error.message);
            return false;
        }
    }

    // Check MongoDB connection status
    async checkMongoDBStatus() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch(`${this.baseURL}/db-status`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error('Failed to get DB status');
            const status = await response.json();
            return status;
        } catch (error) {
            // Silently handle when backend is not available
            if (error.name === 'AbortError' || error.name === 'TypeError' || error.message?.includes('fetch')) {
                return { readyState: 0, readyStateText: 'backend not available', error: 'Backend server not running' };
            }
            return { readyState: 0, readyStateText: 'unknown', error: error.message };
        }
    }

    // Get all products
    async getProducts(category = 'all') {
        try {
            const url = category && category !== 'all' 
                ? `${this.baseURL}/products?category=${category}`
                : `${this.baseURL}/products`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(url, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 503) {
                    throw new Error(errorData.message || 'MongoDB database is not connected. Please check MongoDB Atlas IP whitelist.');
                }
                throw new Error(errorData.error || 'Failed to fetch products');
            }
            return await response.json();
        } catch (error) {
            // Re-throw network errors silently - they will be caught by caller
            if (error.name === 'AbortError' || error.name === 'TypeError' || error.message?.includes('fetch')) {
                throw error; // Let caller handle fallback
            }
            console.error('Error fetching products from API:', error.message);
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

    // Get all orders from MongoDB
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
}

// Create global API service instance
const apiService = new ApiService();

