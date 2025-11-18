    /**
     * Create new product (PATCHED: robust for migration, allows empty/missing fields)
     */
    public function create($data) {
        try {
            if (!Database::isConnected()) {
                throw new \Exception('Database not connected');
            }
            $pdo = Database::getConnection();
            
            // Always generate a safe ID
            $id = isset($data['id']) && $data['id'] ? $data['id'] : (isset($data['_id']) && $data['_id'] ? $data['_id'] : uniqid('prod_', true));

            // Patch: Always provide safe defaults for every field
            $name = isset($data['name']) ? $data['name'] : 'Unnamed Product';
            $price = isset($data['price']) ? floatval($data['price']) : 0.0;
            $description = isset($data['description']) ? $data['description'] : '';
            $category = isset($data['category']) ? $data['category'] : '';
            $size = isset($data['size']) ? $data['size'] : '';
            $quantity = isset($data['quantity']) ? intval($data['quantity']) : 0;
            $image = isset($data['image']) ? $data['image'] : null;

            $sql = "INSERT INTO products (id, name, price, description, category, size, quantity, image) \n                    VALUES (:id, :name, :price, :description, :category, :size, :quantity, :image)";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $id,
                ':name' => $name,
                ':price' => $price,
                ':description' => $description,
                ':category' => $category,
                ':size' => $size,
                ':quantity' => $quantity,
                ':image' => $image
            ]);
            
            return $this->findById($id);
        } catch (\Exception $e) {
            error_log("[PRODUCT MODEL] Error creating product: " . $e->getMessage());
            throw $e;
        }
    }