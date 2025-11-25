#!/usr/bin/env python3
"""
Fix the admin panel HTML in index.html by:
1. Removing misplaced Content Tab elements from Completed Orders tab
2. Properly closing the Completed Orders tab  
3. Adding the missing Products Tab
4. Adding the complete Content Tab
"""

def fix_html():
    # Read the current index.html
    with open(r'c:\Users\TITO\Trendy Dresses Main\Trendy-dress-1\index.html', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # The broken section starts at line 512 (0-indexed: 511)
    # and ends at line 535 (0-indexed: 534)
    
    # Fixed HTML section to insert
    fixed_section = '''                </div>
                <div id="adminCompletedList" style="display: flex; flex-direction: column; gap: 15px;">
                    <!-- Completed orders will be listed here -->
                    <div style="text-align: center; padding: 40px 20px; color: #666;">
                        <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                        <p>Loading completed orders...</p>
                    </div>
                </div>
            </div>

            <!-- Products Tab -->
            <div class="admin-tab-content active" id="productsTab">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h3 style="margin: 0;">Manage Products</h3>
                    <div id="adminProductCount" style="color: var(--primary-color); font-weight: bold; font-size: 1rem;">
                        Total: <span id="adminTotalCount">0</span> products
                    </div>
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #666; z-index: 1;"></i>
                        <input type="text" id="adminProductSearch" placeholder="Search products by name, category, size..." oninput="searchAdminProducts(this.value)" class="admin-search-input">
                    </div>
                    <button class="btn-primary" onclick="openAddProductModal()">
                        <i class="fas fa-plus"></i> Add Product
                    </button>
                    <button class="btn-primary" onclick="refreshProducts()" style="padding: 10px 20px;">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
                <div id="adminSearchResults" style="margin-bottom: 10px; color: #666; font-size: 0.9rem;"></div>
                <div id="adminProductsList" style="display: flex; flex-direction: column; gap: 15px;">
                    <!-- Products will be listed here -->
                    <div style="text-align: center; padding: 40px 20px; color: #666;">
                        <i class="fas fa-box" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;"></i>
                        <p>Loading products...</p>
                    </div>
                </div>
            </div>

            <!-- Content Tab -->
            <div class="admin-tab-content" id="contentTab">
                <h3>Edit Website Content</h3>
                <div class="form-group">
                    <label>Hero Title</label>
                    <input type="text" id="heroTitle" value="Fashion That Speaks Your Style">
                </div>
                <div class="form-group">
                    <label>Hero Description</label>
                    <textarea id="heroDescription" rows="3">Discover the latest trends in dresses and tracksuits</textarea>
                </div>
                <div class="form-group">
                    <label>Hero Background Image</label>
                    <div style="margin-bottom: 10px;">
                        <input type="file" id="heroImageFile" accept="image/*" onchange="handleHeroImageUpload(event)" style="margin-bottom: 10px;">
                        <small style="color: #666; font-size: 0.85rem; display: block;">Upload an image file or enter URL below</small>
                    </div>
                    <div style="margin-top: 10px;">
                        <label style="font-size: 0.9rem; color: #666;">Or enter image URL:</label>
                        <input type="url" id="heroImage" placeholder="https://example.com/hero-image.jpg" oninput="previewHeroImage(this.value)" style="margin-top: 5px;">
                    </div>
                    <div id="heroImagePreview" style="margin-top: 10px; display: none;">
                        <label style="font-size: 0.9rem; color: #666;">Preview:</label>
                        <img id="heroPreviewImg" src="" alt="Hero Preview" style="max-width: 100%; max-height: 200px; margin-top: 5px; border-radius: 5px; border: 1px solid #ddd;">
                        <button type="button" onclick="removeHeroImage()" style="margin-top: 10px; padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-trash"></i> Remove Image
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label>About Us Text</label>
                    <textarea id="aboutText" rows="5">Welcome to Trendy Dresses, your one-stop shop for the latest fashion trends. We offer a wide selection of high-quality dresses and tracksuits that combine style, comfort, and affordability. Our mission is to help you express your unique style with confidence.</textarea>
                </div>
                <button class="btn-primary" onclick="saveContent()">Save Content</button>
            </div>

            <!-- Settings Tab -->
'''
    
    # Replace lines 511-536 (0-indexed) with the fixed section
    new_lines = lines[:511] + [fixed_section] + lines[536:]
    
    # Write the fixed file
    with open(r'c:\Users\TITO\Trendy Dresses Main\Trendy-dress-1\index.html', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print("✅ Successfully fixed index.html")
    print("✅ Added Products Tab with adminProductsList")
    print("✅ Added Content Tab with heroTitle, heroDescription, etc.")
    print("✅ Properly closed Completed Orders tab")

if __name__ == '__main__':
    fix_html()
