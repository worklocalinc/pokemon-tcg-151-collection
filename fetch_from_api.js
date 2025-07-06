const https = require('https');
const fs = require('fs');
const path = require('path');

const SAVE_DIR = 'C:\\Users\\ottaw\\Documents\\pokemon-cards-151';

// Function to make API request
function fetchFromAPI(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
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
            } else {
                file.close();
                fs.unlink(filepath, () => {});
                reject(new Error(`HTTP ${response.statusCode}`));
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

// Main function
async function fetchAndDownload151Cards() {
    console.log('Pokémon TCG 151 Card Fetcher');
    console.log('============================\n');
    
    try {
        // Search for Scarlet & Violet 151 set
        console.log('Searching for Scarlet & Violet 151 set...');
        const searchUrl = 'https://api.pokemontcg.io/v2/cards?q=set.id:sv3pt5&pageSize=250';
        
        const result = await fetchFromAPI(searchUrl);
        
        if (result.data && result.data.length > 0) {
            console.log(`Found ${result.data.length} cards from API\n`);
            
            let downloadCount = 0;
            let errorCount = 0;
            
            // Sort cards by number
            result.data.sort((a, b) => {
                const numA = parseInt(a.number) || 0;
                const numB = parseInt(b.number) || 0;
                return numA - numB;
            });
            
            // Download each card
            for (const card of result.data) {
                const cardNumber = card.number.padStart(3, '0');
                const cardName = card.name;
                const filename = `${cardNumber}_${cleanFilename(cardName)}.png`;
                const filepath = path.join(SAVE_DIR, filename);
                
                // Skip if already exists
                if (fs.existsSync(filepath)) {
                    console.log(`✓ Already exists: ${cardNumber} - ${cardName}`);
                    continue;
                }
                
                // Try to download high-res image
                const imageUrl = card.images?.large || card.images?.small;
                
                if (imageUrl) {
                    try {
                        console.log(`Downloading ${cardNumber}: ${cardName}...`);
                        await downloadImage(imageUrl, filepath);
                        downloadCount++;
                        console.log(`✓ Downloaded: ${cardNumber} - ${cardName}`);
                        
                        // Small delay to be respectful
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (error) {
                        console.error(`✗ Error downloading ${cardNumber}: ${cardName} - ${error.message}`);
                        errorCount++;
                    }
                } else {
                    console.error(`✗ No image URL for ${cardNumber}: ${cardName}`);
                    errorCount++;
                }
            }
            
            console.log('\n=== Download Complete ===');
            console.log(`Downloaded: ${downloadCount} cards`);
            console.log(`Errors: ${errorCount} cards`);
            console.log(`Total processed: ${result.data.length} cards`);
            
        } else {
            console.log('No cards found for set sv3pt5');
            console.log('The API might use a different set ID.');
        }
        
    } catch (error) {
        console.error('Error fetching from API:', error);
    }
}

// Run the fetcher
fetchAndDownload151Cards().catch(console.error);