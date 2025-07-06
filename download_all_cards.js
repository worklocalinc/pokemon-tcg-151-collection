const https = require('https');
const fs = require('fs');
const path = require('path');

// Directory for saving images
const SAVE_DIR = 'C:\\Users\\ottaw\\Documents\\pokemon-cards-151';

// Read the card data that I'll write separately
let cards = [];
try {
    cards = JSON.parse(fs.readFileSync(path.join(SAVE_DIR, 'cards.json'), 'utf8'));
} catch (error) {
    console.error('Please ensure cards.json exists in the directory');
    process.exit(1);
}

// Function to download an image
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

// Function to wait between requests
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Function to query Pokemon TCG API
async function fetchCardFromAPI(cardName, cardNumber) {
    return new Promise((resolve, reject) => {
        // Clean the card name for the API query
        const cleanName = cardName.replace(/[♀♂]/g, '').replace(/'/g, '');
        const setCode = 'sv3pt5'; // Scarlet & Violet 151 set code
        
        const options = {
            hostname: 'api.pokemontcg.io',
            path: `/v2/cards?q=name:"${encodeURIComponent(cleanName)}" set.id:${setCode}`,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };
        
        https.get(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    if (jsonData.data && jsonData.data.length > 0) {
                        // Try to find the exact card by number
                        const exactCard = jsonData.data.find(card => 
                            card.number === cardNumber || 
                            card.number === cardNumber.padStart(3, '0')
                        );
                        
                        if (exactCard && exactCard.images && exactCard.images.large) {
                            resolve(exactCard.images.large);
                        } else if (jsonData.data[0].images && jsonData.data[0].images.large) {
                            // Fallback to first result
                            resolve(jsonData.data[0].images.large);
                        } else {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}
// Main function to download all cards
async function downloadAllCards() {
    console.log('Starting download process for 207 cards...\n');
    
    let successCount = 0;
    let errorCount = 0;
    let apiCount = 0;
    
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const filename = `${card.id.padStart(3, '0')}_${cleanFilename(card.name)}.png`;
        const filepath = path.join(SAVE_DIR, filename);
        
        // Skip if file already exists
        if (fs.existsSync(filepath)) {
            console.log(`✓ Already exists: ${card.id} - ${card.name}`);
            successCount++;
            continue;
        }
        
        try {
            if (card.image_url && !card.image_url.includes('...')) {
                // Download from existing URL
                console.log(`Downloading ${card.id}: ${card.name}...`);
                await downloadImage(card.image_url, filepath);
                successCount++;
            } else {
                // Try to fetch from Pokemon TCG API
                console.log(`Fetching from API ${card.id}: ${card.name}...`);
                await wait(1000); // Rate limiting
                
                const apiImageUrl = await fetchCardFromAPI(card.name, card.id);
                
                if (apiImageUrl) {
                    await downloadImage(apiImageUrl, filepath);
                    successCount++;
                    apiCount++;
                    console.log(`✓ Downloaded from API: ${card.id} - ${card.name}`);
                } else {
                    console.error(`✗ Not found in API: ${card.id} - ${card.name}`);
                    errorCount++;
                }
            }
        } catch (error) {
            console.error(`✗ Error with ${card.id}: ${card.name} - ${error.message}`);
            errorCount++;
        }
        
        // Progress update every 10 cards
        if ((i + 1) % 10 === 0) {
            console.log(`\nProgress: ${i + 1}/${cards.length} cards processed\n`);
        }
    }
    
    console.log('\n=== Download Complete ===');
    console.log(`Successfully downloaded: ${successCount} cards`);
    console.log(`Downloaded from API: ${apiCount} cards`);
    console.log(`Errors/Not found: ${errorCount} cards`);
    console.log(`Total cards processed: ${cards.length}`);
}

// Run the download
downloadAllCards().catch(console.error);