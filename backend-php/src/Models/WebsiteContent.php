<?php
/**
 * WebsiteContent Model
 * Handles hero image, title, description, about text, and contact info
 * Using MariaDB/MySQL for storage
 */

namespace App\Models;

use PDO;
use Exception;

class WebsiteContent {
    private $db;
    
    public function __construct($database = null) {
        $this->db = $database;
    }

    /**
     * Get website content (hero, about, contact info)
     */
    public function getContent() {
        try {
            if (!$this->db) {
                $this->db = \Database::getConnection();
            }
            $stmt = $this->db->prepare("SELECT content FROM website_content WHERE id = 'main'");
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($row) {
                return json_decode($row['content'], true);
            }
            
            // Return defaults if not found
            return $this->getDefaults();
        } catch (Exception $e) {
            error_log('Error getting website content: ' . $e->getMessage());
            return $this->getDefaults();
        }
    }

    /**
     * Save website content
     */
    public function saveContent($data) {
        try {
            if (!$this->db) {
                $this->db = \Database::getConnection();
            }
            // Validate required fields
            if (!isset($data['heroTitle'])) {
                // If we're updating just some parts, we might want to load existing first
                $existing = $this->getContent();
                $data = array_merge($existing, $data);
            }
            
            // Prepare content document
            $contentData = [
                'heroTitle' => $data['heroTitle'] ?? '',
                'heroDescription' => $data['heroDescription'] ?? '',
                'heroImage' => $data['heroImage'] ?? '',
                'aboutText' => $data['aboutText'] ?? '',
                'contactPhone' => $data['contactPhone'] ?? '',
                'contactEmail' => $data['contactEmail'] ?? '',
                'contactAddress' => $data['contactAddress'] ?? '',
                'websiteIcon' => $data['websiteIcon'] ?? '',
                'updatedAt' => date('Y-m-d H:i:s'),
                'updatedBy' => $_SESSION['admin_username'] ?? 'admin'
            ];
            
            $jsonContent = json_encode($contentData);
            $updatedBy = $contentData['updatedBy'];

            // Upsert using MySQL syntax
            $sql = "INSERT INTO website_content (id, content, updatedBy) 
                    VALUES ('main', :content, :updatedBy) 
                    ON DUPLICATE KEY UPDATE 
                    content = :content_update, 
                    updatedBy = :updatedBy_update";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':content' => $jsonContent,
                ':updatedBy' => $updatedBy,
                ':content_update' => $jsonContent,
                ':updatedBy_update' => $updatedBy
            ]);
            
            return $contentData;
        } catch (Exception $e) {
            error_log('Error saving website content: ' . $e->getMessage());
            throw new Exception('Failed to save website content: ' . $e->getMessage());
        }
    }

    /**
     * Get default content
     */
    private function getDefaults() {
        return [
            'heroTitle' => 'Fashion That Speaks Your Style',
            'heroDescription' => 'Discover the latest trends in dresses and tracksuits',
            'heroImage' => '',
            'aboutText' => 'Welcome to Trendy Dresses, your one-stop shop for the latest fashion trends. We offer a wide selection of high-quality dresses and tracksuits that combine style, comfort, and affordability. Our mission is to help you express your unique style with confidence.',
            'contactPhone' => '254724904692',
            'contactEmail' => 'Trendy dresses790@gmail.com',
            'contactAddress' => 'Nairobi, Moi avenue, Imenti HSE Glory Exhibition Basement, Shop B4',
            'websiteIcon' => ''
        ];
    }
}
