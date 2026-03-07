<?php
/**
 * WebsiteContent Model
 * Handles hero image, title, description, about text, and contact info
 */

namespace App\Models;

class WebsiteContent {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }

    /**
     * Get website content (hero, about, contact info)
     */
    public function getContent() {
        try {
            $collection = $this->db->website_content;
            
            // Find the main content document (usually just one)
            $content = $collection->findOne(['_id' => 'main']);
            
            if ($content) {
                // Remove MongoDB _id field for cleaner response
                unset($content['_id']);
                return $content;
            }
            
            // Return defaults if not found
            return $this->getDefaults();
        } catch (\Exception $e) {
            error_log('Error getting website content: ' . $e->getMessage());
            return $this->getDefaults();
        }
    }

    /**
     * Save website content
     */
    public function saveContent($data) {
        try {
            $collection = $this->db->website_content;
            
            // Validate required fields
            if (!isset($data['heroTitle'])) {
                throw new \Exception('Hero title is required');
            }
            
            // Prepare content document
            $content = [
                'heroTitle' => $data['heroTitle'] ?? '',
                'heroDescription' => $data['heroDescription'] ?? '',
                'heroImage' => $data['heroImage'] ?? '',
                'aboutText' => $data['aboutText'] ?? '',
                'contactPhone' => $data['contactPhone'] ?? '',
                'contactEmail' => $data['contactEmail'] ?? '',
                'contactAddress' => $data['contactAddress'] ?? '',
                'websiteIcon' => $data['websiteIcon'] ?? '',
                'updatedAt' => new \MongoDB\BSON\UTCDateTime(time() * 1000),
                'updatedBy' => $_SESSION['username'] ?? 'admin'
            ];
            
            // Upsert (update or insert)
            $result = $collection->updateOne(
                ['_id' => 'main'],
                ['$set' => $content],
                ['upsert' => true]
            );
            
            return $content;
        } catch (\Exception $e) {
            error_log('Error saving website content: ' . $e->getMessage());
            throw new \Exception('Failed to save website content: ' . $e->getMessage());
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
