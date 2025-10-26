# Open Food Facts Proxy API

A tiny Node.js API that proxies & normalizes Open Food Facts data with CORS allowlist, caching, and consistent error responses.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

3. **Test the API:**
   ```bash
   # Health check
   curl http://localhost:8080/v1/health
   
   # Get product by barcode
   curl http://localhost:8080/v1/products/3017620422003
   
   # Batch lookup
   curl "http://localhost:8080/v1/products?codes=3017620422003,3017620422004"
   ```

## API Endpoints

### Health Check
- **GET** `/v1/health`
- Returns server status and upstream URL

### Single Product
- **GET** `/v1/products/:barcode`
- Returns normalized product data for a specific barcode

### Batch Products
- **GET** `/v1/products?codes=barcode1,barcode2,barcode3`
- Returns normalized product data for multiple barcodes

## Configuration

Copy `env.example` to `.env` and modify as needed:

```bash
cp env.example .env
```

Environment variables:
- `PORT` - Server port (default: 8080)
- `OFF_BASE` - Open Food Facts base URL
- `USER_AGENT` - User agent for requests
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)

## Testing Examples

### Using curl

```bash
# Health check
curl http://localhost:8080/v1/health

# Single product (Nutella example)
curl http://localhost:8080/v1/products/3017620422003

# Batch lookup
curl "http://localhost:8080/v1/products?codes=3017620422003,3017620422004"

# Test CORS (from browser console)
fetch('http://localhost:8080/v1/health')
  .then(r => r.json())
  .then(console.log)
```

### Using JavaScript/Fetch

```javascript
// Single product
const response = await fetch('http://localhost:8080/v1/products/3017620422003');
const product = await response.json();
console.log(product);

// Batch lookup
const batchResponse = await fetch('http://localhost:8080/v1/products?codes=3017620422003,3017620422004');
const products = await batchResponse.json();
console.log(products);
```

### Using Postman/Insomnia

1. Create a new GET request
2. URL: `http://localhost:8080/v1/products/3017620422003`
3. Send the request

## Response Format

The API returns normalized product data:

```json
{
  "barcode": "3017620422003",
  "name": "Nutella",
  "brand": "Ferrero",
  "image": "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.4.400.jpg",
  "nutri_score": "e",
  "nutriments": {
    "energy_kcal_100g": 539,
    "sugars_100g": 56.3,
    "salt_100g": 0.107
  },
  "source": "openfoodfacts"
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Barcode 123456789 not found",
  "instance": "/v1/products/123456789"
}
```

## Features

- ✅ CORS allowlist with configurable origins
- ✅ In-memory LRU cache (10min TTL, 1000 items max)
- ✅ Consistent error responses
- ✅ Normalized product data
- ✅ Batch product lookup
- ✅ Health check endpoint
- ✅ Request timeout handling
- ✅ User agent configuration
