const https = require('https');
const fs = require('fs');
const path = require('path');

const SAVE_DIR = 'C:\\Users\\ottaw\\Documents\\pokemon-cards-151';

// Function to download image with proper error handling
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        if (!url || url.includes('...')) {
            reject(new Error('Invalid or incomplete URL'));
            return;
        }
        
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
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
                if (response.headers.location) {
                    downloadImage(response.headers.location, filepath)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(new Error('Redirect without location header'));
                }
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

// Function to wait
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function
async function downloadAvailableCards() {
    console.log('Pokemon 151 Card Downloader (Squarespace Images)');
    console.log('================================================\n');
    
    // Read the card data
    const cardsPath = path.join(__dirname, 'cards_data.json');
    
    if (!fs.existsSync(cardsPath)) {
        console.error('Error: cards_data.json not found!');
        console.error('Please save your card data to cards_data.json first.');
        return;
    }
    
    const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
    console.log(`Total cards in data: ${cards.length}\n`);
    
    // Separate cards with complete URLs vs incomplete
    const completeUrls = cards.filter(card => 
        card.image_url && !card.image_url.includes('...')
    );
    const incompleteUrls = cards.filter(card => 
        !card.image_url || card.image_url.includes('...')
    );
    
    console.log(`Cards with complete URLs: ${completeUrls.length}`);
    console.log(`Cards with incomplete URLs: ${incompleteUrls.length}\n`);
    
    // Download cards with complete URLs
    let successCount = 0;
    let errorCount = 0;
    
    console.log('Downloading cards with complete URLs...\n');
    
    for (const card of completeUrls) {
        const filename = `${card.id.padStart(3, '0')}_${cleanFilename(card.name)}.png`;
        const filepath = path.join(SAVE_DIR, filename);
        
        // Skip if already exists
        if (fs.existsSync(filepath)) {
            console.log(`✓ Already exists: ${card.id} - ${card.name}`);
            successCount++;
            continue;
        }
        
        try {
            console.log(`Downloading ${card.id}: ${card.name}...`);
            await downloadImage(card.image_url, filepath);
            successCount++;
            console.log(`✓ Downloaded: ${card.id} - ${card.name}`);
            await wait(500); // Be respectful
        } catch (error) {
            console.error(`✗ Error with ${card.id}: ${card.name} - ${error.message}`);
            errorCount++;
        }
    }
    
    // Report on missing cards
    console.log('\n=== Download Summary ===');
    console.log(`Successfully downloaded: ${successCount} cards`);
    console.log(`Errors: ${errorCount} cards`);
    console.log(`Missing URLs: ${incompleteUrls.length} cards\n`);
    
    if (incompleteUrls.length > 0) {
        console.log('Cards with missing URLs:');
        incompleteUrls.forEach(card => {
            console.log(`  ${card.id}: ${card.name}`);
        });
        
        console.log('\nTo complete your collection, you need to find the URLs for these cards.');
    }
}

// Run the download
downloadAvailableCards().catch(console.error);