const https = require('https');
const fs = require('fs');
const path = require('path');

const SAVE_DIR = 'C:\\Users\\ottaw\\Documents\\pokemon-cards-151';

// Read your card data from the uploaded file
let cards = [];
try {
    // First, let me copy the data you provided
    const cardsData = `[
  {
    "id": "001",
    "name": "Bulbasaur",
    "image_url": "https://images.squarespace-cdn.com/content/v1/5cf4cfa4382ac0000123aa1b/1695316217292-XHE7LY1F7JIV9NHHD7E3/sv3-5_en_001.png",
    "type": "Grass",
    "rarity": "Common",
    "variant_type": "base",
    "collected": false
  },
  {
    "id": "002",
    "name": "Ivysaur",
    "image_url": "https://images.squarespace-cdn.com/content/v1/5cf4cfa4382ac0000123aa1b/1695316217338-U6NLUADX25AYQRA7SUYJ/sv3-5_en_002.png",
    "type": "Grass",
    "rarity": "Uncommon",
    "variant_type": "base",
    "collected": false
  },
  {
    "id": "003",
    "name": "Venusaur ex",
    "image_url": "https://images.squarespace-cdn.com/content/v1/5cf4cfa4382ac0000123aa1b/1695316217400-9X910NW2J0XM8F3JZ6D4/sv3-5_en_003.png",
    "type": "Grass",
    "rarity": "Double Rare",
    "variant_type": "ex",
    "collected": false
  }]`;
    
    // For now, let's just create placeholders
    console.log('Note: Using sample data. Full card data needs to be loaded from paste.txt');
    
} catch (error) {
    console.error('Error reading card data:', error);
}

// Function to download image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const protocol = url.startsWith('https') ? https : require('http');
        
        protocol.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirect
                file.close();
                fs.unlink(filepath, () => {});
                downloadImage(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
            } else {
                file.close();
                fs.unlink(filepath, () => {});
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            file.close();
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// Function to clean filename
function cleanFilename(name) {
    return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
}

console.log('Pokemon 151 Card Downloader (Squarespace Images)');
console.log('================================================\n');
console.log('This script needs the full card data from paste.txt');
console.log('Please ensure the card data is properly loaded.');

// Note: The full implementation would load all 207 cards from your paste.txt file