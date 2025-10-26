# Recipe Generation API - Usage Guide

## 🌐 Endpoint

**URL:** `https://api-generate-recipes.vercel.app/api/generate_recipes`  
**Method:** POST  
**Content-Type:** application/json

## 📝 Request Format

### Basic Request Structure

```json
{
  "inventory": [
    {
      "name": "Chicken Breast",
      "quantity": 500,
      "unit": "grams"
    },
    {
      "name": "Rice",
      "quantity": 300,
      "unit": "grams"
    },
    {
      "name": "Olive Oil",
      "quantity": 50,
      "unit": "ml"
    }
  ],
  "dietary_filters": [],
  "count": 1
}
```

### Request with Full Nutritional Data

```json
{
  "inventory": [
    {
      "id": "ITEM-001",
      "name": "Salmon",
      "category": "Protein",
      "quantity": 300,
      "unit": "grams",
      "calories_kcal": 206,
      "protein_g": 22.1,
      "carbohydrates_g": 0,
      "fiber_g": 0,
      "sugars_g": 0,
      "fat_g": 12.4,
      "sodium_mg": 59,
      "tags": ["omega-3", "high-protein"],
      "allergens": ["fish"]
    },
    {
      "id": "ITEM-002",
      "name": "Quinoa",
      "category": "Grains",
      "quantity": 200,
      "unit": "grams",
      "calories_kcal": 120,
      "protein_g": 4.4,
      "carbohydrates_g": 21.3,
      "fiber_g": 2.8,
      "sugars_g": 0.9,
      "fat_g": 1.9,
      "sodium_mg": 7,
      "tags": ["gluten-free", "complete-protein"],
      "allergens": []
    }
  ],
  "dietary_filters": [],
  "count": 1
}
```

> **💡 Tip:** Providing nutritional data results in more detailed and accurate nutrition notes in the generated recipes!

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `inventory` | Array | ✅ Yes | List of available ingredients |
| `inventory[].name` | String | ✅ Yes | Name of the ingredient |
| `inventory[].quantity` | Number | ✅ Yes | Amount available |
| `inventory[].unit` | String | ✅ Yes | Unit (grams, ml, cups, pieces, etc.) |
| `inventory[].id` | String | ❌ No | Optional ID (auto-generated if not provided) |
| `inventory[].category` | String | ❌ No | Optional category (default: "Other") |
| `inventory[].calories_kcal` | Number | ❌ No | Optional calories per serving in kcal (default: 0) |
| `inventory[].protein_g` | Number | ❌ No | Optional protein content in grams (default: 0) |
| `inventory[].carbohydrates_g` | Number | ❌ No | Optional carbohydrates in grams (default: 0) |
| `inventory[].fiber_g` | Number | ❌ No | Optional fiber in grams (default: 0) |
| `inventory[].sugars_g` | Number | ❌ No | Optional sugars in grams (default: 0) |
| `inventory[].fat_g` | Number | ❌ No | Optional fat content in grams (default: 0) |
| `inventory[].sodium_mg` | Number | ❌ No | Optional sodium in milligrams (default: 0) |
| `inventory[].tags` | Array | ❌ No | Optional tags describing the ingredient |
| `inventory[].allergens` | Array | ❌ No | Optional list of allergens |
| `dietary_filters` | Array | ❌ No | Dietary restrictions (e.g., ["vegetarian", "vegan"]) |
| `count` | Number | ❌ No | Number of different recipes to generate (default: 2) |
| `recipes` | Number | ❌ No | Total number of servings desired across all recipes (e.g., 50) |

**Note:** All nutritional fields are optional. The API handles missing, null, or invalid values gracefully by defaulting to 0.

**Servings Parameter (`recipes`):** When specified, tells the API how many total servings you want. The API distributes servings across the generated recipes and the LLM validates if there are sufficient ingredients. The LLM will be honest if ingredients are insufficient and adjust servings accordingly.

### Supported Units

- **Weight:** grams, kg, oz, pounds
- **Volume:** ml, liters, cups, tablespoons, teaspoons
- **Count:** pieces, items, units
- **Other:** Any unit you specify

## 📊 Response Format

```json
{
  "success": true,
  "recipes": [
    {
      "title": "Simple Chicken and Rice Bowl",
      "description": "A quick and easy meal with tender chicken and fluffy rice.",
      "servings": 2,
      "prep_time_minutes": 5,
      "ingredients": [
        {
          "inventory_item_id": "ITEM-001",
          "name": "Chicken Breast",
          "quantity": 250.0,
          "unit": "grams"
        }
      ],
      "instructions": [
        "First, cook the rice...",
        "While the rice is cooking..."
      ],
      "equipment": ["Pot", "Pan", "Knife"],
      "nutrition_notes": ["Good source of protein"],
      "dietary_tags": ["Gluten-Free"],
      "inventory_depletion_summary": [
        {
          "id": "ITEM-001",
          "quantity": 250.0,
          "unit": "grams"
        }
      ],
      "substitutions": [],
      "packaging": "Reusable container"
    }
  ],
  "count": 1
}
```

## 💻 Code Examples

### cURL

```bash
curl -X POST https://api-generate-recipes.vercel.app/api/generate_recipes \
  -H "Content-Type: application/json" \
  -d '{
    "inventory": [
      {"name": "Chicken Breast", "quantity": 500, "unit": "grams"},
      {"name": "Rice", "quantity": 300, "unit": "grams"},
      {"name": "Olive Oil", "quantity": 50, "unit": "ml"}
    ],
    "dietary_filters": [],
    "count": 1
  }'
```

### JavaScript / TypeScript

```javascript
const response = await fetch('https://api-generate-recipes.vercel.app/api/generate_recipes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inventory: [
      { name: 'Chicken Breast', quantity: 500, unit: 'grams' },
      { name: 'Rice', quantity: 300, unit: 'grams' },
      { name: 'Olive Oil', quantity: 50, unit: 'ml' }
    ],
    dietary_filters: [],
    count: 1
  })
});

const data = await response.json();
console.log(data.recipes);
```

### Python

```python
import requests

response = requests.post(
    'https://api-generate-recipes.vercel.app/api/generate_recipes',
    json={
        'inventory': [
            {'name': 'Chicken Breast', 'quantity': 500, 'unit': 'grams'},
            {'name': 'Rice', 'quantity': 300, 'unit': 'grams'},
            {'name': 'Olive Oil', 'quantity': 50, 'unit': 'ml'}
        ],
        'dietary_filters': [],
        'count': 1
    }
)

data = response.json()
for recipe in data['recipes']:
    print(f"Recipe: {recipe['title']}")
    print(f"Servings: {recipe['servings']}")
    print(f"Time: {recipe['prep_time_minutes']} minutes")
```

### React Example

```tsx
import { useState } from 'react';

function RecipeGenerator() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateRecipes = async () => {
    setLoading(true);
    
    const response = await fetch('https://api-generate-recipes.vercel.app/api/generate_recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inventory: [
          { name: 'Chicken Breast', quantity: 500, unit: 'grams' },
          { name: 'Rice', quantity: 300, unit: 'grams' }
        ],
        count: 2
      })
    });
    
    const data = await response.json();
    setRecipes(data.recipes);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={generateRecipes} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Recipes'}
      </button>
      
      {recipes.map((recipe, i) => (
        <div key={i}>
          <h2>{recipe.title}</h2>
          <p>{recipe.description}</p>
          <ul>
            {recipe.instructions.map((step, j) => (
              <li key={j}>{step}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

## 🎯 Dietary Filters

Supported dietary filters:
- `vegetarian`
- `vegan`
- `gluten-free`
- `dairy-free`
- `nut-free`
- `low-carb`
- `keto`
- `paleo`
- `halal`
- `kosher`

Example:
```json
{
  "inventory": [...],
  "dietary_filters": ["vegetarian", "gluten-free"],
  "count": 2
}
```

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "No inventory provided"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Error message details"
}
```

## 📈 Rate Limits

Currently no rate limits. API is free to use!

## 🔐 Authentication

No authentication required. The API is publicly accessible.

## 💡 Tips

1. **Be specific with ingredient names** - "Chicken Breast" is better than just "Chicken"
2. **Use consistent units** - Stick to metric (grams/ml) or imperial (oz/cups)
3. **Provide enough ingredients** - At least 3-4 ingredients work best
4. **Try different dietary filters** - Experiment to get varied recipes
5. **Generate multiple recipes** - Set `count: 3` or more for variety

## 🐛 Troubleshooting

**Problem:** Getting empty recipes  
**Solution:** Make sure you have at least 2-3 ingredients with reasonable quantities

**Problem:** Recipes don't match dietary filters  
**Solution:** Double-check your `dietary_filters` array spelling

**Problem:** Slow response  
**Solution:** API uses AI generation, typically takes 5-15 seconds per recipe

## 📞 Support

- GitHub Issues: [Report a bug](https://github.com/your-repo/issues)
- Vercel Dashboard: [View logs](https://vercel.com/erics-projects-17f00cbc/api-generate-recipes)

---

**Last Updated:** October 26, 2025  
**API Version:** 1.0  
**Status:** ✅ Live

