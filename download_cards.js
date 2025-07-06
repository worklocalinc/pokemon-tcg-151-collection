const https = require('https');
const fs = require('fs');
const path = require('path');

// Read the card data
const cards = JSON.parse(fs.readFileSync('paste.txt', 'utf8'));

// Function to download an image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {}); // Delete the file on error
            reject(err);
        });
    });
}

// Function to clean filename
function cleanFilename(name) {
    return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
}

async function downloadAllCards() {
    console.log('Starting download process...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const card of cards) {
        if (card.image_url && !card.image_url.includes('...')) {
            const filename = `${card.id.padStart(3, '0')}_${cleanFilename(card.name)}.png`;
            const filepath = path.join('C:\\Users\\ottaw\\Documents\\pokemon-cards-151', filename);
            
            try {
                console.log(`Downloading ${card.id}: ${card.name}...`);
                await downloadImage(card.image_url, filepath);
                successCount++;
            } catch (error) {
                console.error(`Error downloading ${card.id}: ${card.name} - ${error.message}`);
                errorCount++;
            }
        }
    }
    
    console.log(`\nDownload complete!`);
    console.log(`Successfully downloaded: ${successCount} cards`);
    console.log(`Errors: ${errorCount}`);
}

downloadAllCards();
