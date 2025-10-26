# Open Food Facts API - Creo Integration Guide

This guide shows how to integrate the Open Food Facts Proxy API into your Creo app using the [Custom API integration feature](https://docs.creao.ai/integrations/apis).

## 📋 Files for Creo Integration

### 1. OpenAPI Specification
**File:** `openapi-spec.json`
- Complete OpenAPI 3.0 specification
- Includes all endpoints, schemas, and examples
- Ready to upload to Creo's custom API integration

### 2. Creo API Configuration  
**File:** `creao-api-config.json`
- Simplified configuration for Creo
- Includes authentication details (none required)
- Test configuration with sample data

### 3. Test Script
**File:** `test-api.js`
- Node.js test script to verify API functionality
- Tests all endpoints and error handling
- Run with: `node test-api.js`

## 🚀 Integration Steps in Creo

### Step 1: Access Custom API Integration
1. Go to your Creo app dashboard
2. Navigate to **Integrations** → **APIs**
3. Click **"Add Custom API"** (Pro feature)

### Step 2: Upload OpenAPI Specification
1. Upload the `openapi-spec.json` file
2. Creo will automatically parse the endpoints and schemas
3. Verify the detected endpoints match your needs

### Step 3: Configure Authentication
- **Authentication Type:** None (Public API)
- **Base URL:** `https://openfoodfacts-aavahis2h-erics-projects-17f00cbc.vercel.app`
- No API keys or OAuth required

### Step 4: Test Connection
Use these test values:
- **Health Check:** `GET /v1/health`
- **Single Product:** `GET /v1/products/3017620422003`
- **Batch Products:** `GET /v1/products?codes=3017620422003,3017620422004`

### Step 5: Map to Your App
Link the API endpoints to:
- **Data Tables:** Store product information
- **Pages:** Display product details
- **Copilot Commands:** Search products by barcode

## 📱 Usage in Your Creo App

### Get Product Information
```javascript
// Single product lookup
const product = await fetch('/api/v1/products/3017620422003');
const data = await product.json();

// Access product data
console.log(data.product_name_en); // "Nutella"
console.log(data.allergens_tags);  // ["en:milk", "en:nuts", "en:soybeans"]
```

### Batch Product Lookup
```javascript
// Multiple products
const products = await fetch('/api/v1/products?codes=3017620422003,3017620422004');
const data = await products.json();
```

### Error Handling
```javascript
try {
  const response = await fetch('/api/v1/products/invalid-barcode');
  if (!response.ok) {
    const error = await response.json();
    console.log(error.detail); // "Barcode invalid-barcode not found"
  }
} catch (error) {
  console.error('API Error:', error);
}
```

## 🔧 Available Endpoints

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/v1/health` | GET | API health check | None |
| `/v1/products/{barcode}` | GET | Get single product | `barcode` (path) |
| `/v1/products` | GET | Get multiple products | `codes` (query) |

## 📊 Response Data Structure

Each product includes:
- **Basic Info:** `code`, `product_name_en`, `generic_name_en`
- **Quantities:** `quantity`, `product_quantity`, `serving_size`
- **Ingredients:** Detailed `ingredients` array with analysis
- **Allergens:** `allergens_tags` array
- **Analysis:** `ingredients_analysis_tags` for dietary info

## 🛠️ Troubleshooting

### Common Issues
1. **CORS Errors:** Ensure your Creo app domain is in the allowed origins
2. **Rate Limits:** API has built-in caching (10 minutes)
3. **Invalid Barcodes:** Returns 404 with error details

### Testing
Run the test script to verify everything works:
```bash
cd API_openFoodFacts
node test-api.js
```

## 📚 Additional Resources

- [Creo API Integration Docs](https://docs.creao.ai/integrations/apis)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Open Food Facts Database](https://world.openfoodfacts.org/)

## 🎯 Next Steps

1. Upload the OpenAPI spec to Creo
2. Test the connection with sample barcodes
3. Map endpoints to your app's data tables
4. Create UI components to display product information
5. Add barcode scanning functionality to your app

Your Open Food Facts API is now ready for Creo integration! 🚀
