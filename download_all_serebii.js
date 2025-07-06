const https = require('https');
const fs = require('fs');
const path = require('path');

const SAVE_DIR = 'C:\\Users\\ottaw\\Documents\\pokemon-cards-151';

// All 207 card names in order
const cardNames = [
  "Bulbasaur", "Ivysaur", "Venusaur ex", "Charmander", "Charmeleon", "Charizard ex",
  "Squirtle", "Wartortle", "Blastoise ex", "Caterpie", "Metapod", "Butterfree",
  "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot",
  "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok ex",
  "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran♀", "Nidorina",
  "Nidoqueen", "Nidoran♂", "Nidorino", "Nidoking", "Clefairy", "Clefable",
  "Vulpix", "Ninetales ex", "Jigglypuff", "Wigglytuff ex", "Zubat", "Golbat",
  "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat",
  "Venomoth", "Diglett", "Dugtrio", "Meowth", "Persian", "Psyduck",
  "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag",
  "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam ex", "Machop",
  "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel", "Tentacool",
  "Tentacruel", "Geodude", "Graveler", "Golem ex", "Ponyta", "Rapidash",
  "Slowpoke", "Slowbro", "Magnemite", "Magneton", "Farfetch'd", "Doduo",
  "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder",
  "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee",
  "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode", "Exeggcute",
  "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung",
  "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey", "Tangela",
  "Kangaskhan ex", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu",
  "Starmie", "Mr. Mime", "Scyther", "Jynx ex", "Electabuzz", "Magmar",
  "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto",
  "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte",
  "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", "Articuno",
  "Zapdos ex", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo",
  "Mew ex", "Antique Dome Fossil", "Antique Helix Fossil", "Antique Old Amber",
  "Big Air Balloon", "Bill's Transfer", "Cycling Road", "Daisy's Help",
  "Energy Sticker", "Erika's Invitation", "Giovanni's Charisma", "Grabber",
  "Leftovers", "Protective Goggles", "Rigid Band"
];

// Continue with illustration rares and secret rares (166-207)
const additionalCards = [
  "Bulbasaur", "Ivysaur", "Charmander", "Charmeleon", "Squirtle", "Wartortle",
  "Caterpie", "Pikachu", "Nidoking", "Psyduck", "Poliwhirl", "Machoke",
  "Tangela", "Mr. Mime", "Omanyte", "Dragonair", "Venusaur ex", "Charizard ex",
  "Blastoise ex", "Arbok ex", "Ninetales ex", "Wigglytuff ex", "Alakazam ex",
  "Golem ex", "Kangaskhan ex", "Jynx ex", "Zapdos ex", "Mew ex",
  "Bill's Transfer", "Daisy's Help", "Erika's Invitation", "Giovanni's Charisma",
  "Venusaur ex", "Charizard ex", "Blastoise ex", "Alakazam ex", "Zapdos ex",
  "Erika's Invitation", "Giovanni's Charisma", "Mew ex", "Switch", "Basic Psychic Energy"
];

// Combine all cards
const allCardNames = [...cardNames, ...additionalCards];

// Function to download an image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
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

// Function to wait between requests
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main download function
async function downloadAllCards() {
    console.log(`Starting download of ${allCardNames.length} cards from Serebii...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < allCardNames.length; i++) {
        const cardNumber = (i + 1).toString();
        const cardName = allCardNames[i];
        const filename = `${cardNumber.padStart(3, '0')}_${cleanFilename(cardName)}.jpg`;
        const filepath = path.join(SAVE_DIR, filename);
        
        // Skip if file already exists
        if (fs.existsSync(filepath)) {
            console.log(`✓ Already exists: ${cardNumber} - ${cardName}`);
            successCount++;
            continue;
        }
        
        // Serebii URL
        const imageUrl = `https://www.serebii.net/card/th/151/${cardNumber}.jpg`;
        
        try {
            console.log(`Downloading ${cardNumber}: ${cardName}...`);
            await downloadImage(imageUrl, filepath);
            successCount++;
            console.log(`✓ Downloaded: ${cardNumber} - ${cardName}`);
            
            // Small delay to be respectful
            await wait(500);
        } catch (error) {
            console.error(`✗ Error with ${cardNumber}: ${cardName} - ${error.message}`);
            errorCount++;
        }
        
        // Progress update every 20 cards
        if ((i + 1) % 20 === 0) {
            console.log(`\n=== Progress: ${i + 1}/${allCardNames.length} cards processed ===\n`);
        }
    }
    
    console.log('\n=== Download Complete ===');
    console.log(`Successfully downloaded: ${successCount} cards`);
    console.log(`Errors: ${errorCount} cards`);
    console.log(`Total cards processed: ${allCardNames.length}`);
    console.log(`\nAll images saved to: ${SAVE_DIR}`);
}

// Run the download
console.log('Pokédex 151 Card Downloader');
console.log('===========================\n');
downloadAllCards().catch(console.error);