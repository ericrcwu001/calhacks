// Test script for Open Food Facts Proxy API
// Run with: node test-api.js

const API_BASE = "https://openfoodfacts-bxawn130t-erics-projects-17f00cbc.vercel.app";

async function testAPI() {
  console.log("🧪 Testing Open Food Facts Proxy API\n");
  
  try {
    // Test 1: Health Check
    console.log("1️⃣ Testing Health Endpoint...");
    const healthResponse = await fetch(`${API_BASE}/v1/health`);
    const healthData = await healthResponse.json();
    console.log("✅ Health Check:", healthData);
    console.log("");
    
    // Test 2: Single Product Lookup
    console.log("2️⃣ Testing Single Product Lookup...");
    const productResponse = await fetch(`${API_BASE}/v1/products/3017620422003`);
    const productData = await productResponse.json();
    console.log("✅ Product Data:", {
      code: productData.code,
      name: productData.product_name_en,
      brand: productData.generic_name_en,
      quantity: productData.quantity,
      allergens: productData.allergens_tags,
      ingredients_count: productData.ingredients?.length || 0
    });
    console.log("");
    
    // Test 3: Batch Product Lookup
    console.log("3️⃣ Testing Batch Product Lookup...");
    const batchResponse = await fetch(`${API_BASE}/v1/products?codes=3017620422003,3017620422004`);
    const batchData = await batchResponse.json();
    console.log("✅ Batch Data:", {
      count: batchData.length,
      products: batchData.map(p => ({
        code: p.code,
        name: p.product_name_en,
        allergens: p.allergens_tags
      }))
    });
    console.log("");
    
    // Test 4: Error Handling
    console.log("4️⃣ Testing Error Handling...");
    const errorResponse = await fetch(`${API_BASE}/v1/products/9999999999999`);
    const errorData = await errorResponse.json();
    console.log("✅ Error Response:", {
      status: errorResponse.status,
      title: errorData.title,
      detail: errorData.detail
    });
    console.log("");
    
    console.log("🎉 All tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the tests
testAPI();
