// First, let me download the cards we already have good URLs for
const https = require('https');
const fs = require('fs');
const path = require('path');

const SAVE_DIR = 'C:\\Users\\ottaw\\Documents\\pokemon-cards-151';

// Cards with working URLs (first 43 cards)
const workingCards = [
  {
    "id": "001",
    "name": "Bulbasaur",
    "image_url": "https://images.squarespace-cdn.com/content/v1/5cf4cfa4382ac0000123aa1b/1695316217292-XHE7LY1F7JIV9NHHD7E3/sv3-5_en_001.png"
  },
  {
    "id": "002",
    "name": "Ivysaur",
    "image_url": "https://images.squarespace-cdn.com/content/v1/5cf4cfa4382ac0000123aa1b/1695316217338-U6NLUADX25AYQRA7SUYJ/sv3-5_en_002.png"
  },
  {
    "id": "003",
    "name": "Venusaur ex",
    "image_url": "https://images.squarespace-cdn.com/content/v1/5cf4cfa4382ac0000123aa1b/1695316217400-9X910NW2J0XM8F3JZ6D4/sv3-5_en_003.png"
  },
  {
    "id": "004",
    "name": "Charmander",
    "image_url": "https://images.squarespace-cdn.com/content/v1/5cf4cfa4382ac0000123aa1b/1695316217438-K1S6QB2G0W7MHOXMMS5N/sv3-5_en_004.png"
  },
  {
    "id": "005",
    "name": "Charmeleon",
    "image_url": "https://images.squarespace-cdn.com/content/v1/5cf4cfa4382ac0000123aa1b/1695316217474-3VA4UT9K3V07C83Q8VG4/sv3-5_en_005.png"
  }