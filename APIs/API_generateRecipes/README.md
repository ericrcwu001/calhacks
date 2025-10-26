# Recipe Generation API

A serverless API for generating creative recipes from inventory items using Google Gemini AI. Deployed on Vercel.

## Features

- Generate custom recipes based on available inventory
- Support for dietary restrictions (vegetarian, nut-free, etc.)
- Generate multiple unique recipes per request
- Full CORS support for web applications

## Deployment to Vercel

### Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A [Google API key](https://makersuite.google.com/app/apikey) for Gemini AI

### Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy the project**:
   ```bash
   vercel
   ```

4. **Set environment variables** in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add the following variables:
     - `GOOGLE_API_KEY`: Your Google Gemini API key (required)
     - `API_KEY`: Optional custom API key for authentication

5. **Redeploy** to apply environment variables:
   ```bash
   vercel --prod
   ```

Your API will be live at: `https://your-app.vercel.app/api/generate_recipes`

## API Documentation

### Endpoint

```
POST /api/generate_recipes
```

### Headers

- `Content-Type: application/json`
- `X-API-Key: your_key_here` (optional, only if `API_KEY` env var is set)

### Request Body

```json
{
  "inventory": [
    {
      "id": "ITEM-001",
      "name": "Brown Rice",
      "category": "Grains",
      "quantity": 5,
      "unit": "cups"
    },
    {
      "id": "ITEM-002",
      "name": "Black Beans",
      "category": "Legumes",
      "quantity": 2,
      "unit": "cans"
    }
  ],
  "dietary_filters": ["vegetarian"],
  "count": 2
}
```

### Request Fields

- `inventory` (required): Array of inventory items
  - `id`: Unique identifier
  - `name`: Item name
  - `category`: Food category
  - `quantity`: Available quantity
  - `unit`: Unit of measurement (cups, pieces, cans, etc.)
- `dietary_filters` (optional): Array of dietary restrictions
  - Examples: "vegetarian", "vegan", "nut-free", "gluten-free"
- `count` (optional): Number of recipes to generate (default: 2)

### Success Response (200)

```json
{
  "success": true,
  "recipes": [
    {
      "title": "Rice and Bean Bowl",
      "description": "A hearty vegetarian meal",
      "servings": 2,
      "prep_time_minutes": 20,
      "ingredients": [
        {
          "inventory_item_id": "ITEM-001",
          "name": "Brown Rice",
          "quantity": 2.0,
          "unit": "cups"
        }
      ],
      "instructions": [
        "Cook the rice according to package instructions",
        "Add beans and mix well"
      ],
      "equipment": ["Pot", "Spoon"],
      "nutrition_notes": ["High fiber"],
      "dietary_tags": ["Vegetarian"],
      "inventory_depletion_summary": [
        {
          "id": "ITEM-001",
          "quantity": 2.0,
          "unit": "cups"
        }
      ],
      "substitutions": [],
      "packaging": "Container"
    }
  ],
  "count": 2
}
```

### Error Responses

**400 Bad Request** - Missing or invalid inventory:
```json
{
  "success": false,
  "error": "No inventory provided"
}
```

**401 Unauthorized** - Invalid API key:
```json
{
  "success": false,
  "error": "Unauthorized. Invalid or missing API key."
}
```

**500 Internal Server Error** - Recipe generation failed:
```json
{
  "success": false,
  "error": "Error message details"
}
```

## Example Usage

### Using cURL

```bash
curl -X POST https://your-app.vercel.app/api/generate_recipes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "inventory": [
      {
        "id": "ITEM-001",
        "name": "Brown Rice",
        "category": "Grains",
        "quantity": 5,
        "unit": "cups"
      }
    ],
    "dietary_filters": ["vegetarian"],
    "count": 2
  }'
```

### Using JavaScript (Fetch API)

```javascript
const response = await fetch('https://your-app.vercel.app/api/generate_recipes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify({
    inventory: [
      {
        id: 'ITEM-001',
        name: 'Brown Rice',
        category: 'Grains',
        quantity: 5,
        unit: 'cups'
      }
    ],
    dietary_filters: ['vegetarian'],
    count: 2
  })
});

const data = await response.json();
console.log(data);
```

### Using Python (requests library)

```python
import requests

url = 'https://your-app.vercel.app/api/generate_recipes'
headers = {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
}
payload = {
    'inventory': [
        {
            'id': 'ITEM-001',
            'name': 'Brown Rice',
            'category': 'Grains',
            'quantity': 5,
            'unit': 'cups'
        }
    ],
    'dietary_filters': ['vegetarian'],
    'count': 2
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print(data)
```

## Local Development

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables**:
   ```bash
   export GOOGLE_API_KEY=your_google_api_key
   export API_KEY=your_optional_api_key
   ```

3. **Run local server** (using Vercel CLI):
   ```bash
   vercel dev
   ```

## Project Structure

```
.
├── api/
│   ├── generate_recipes.py    # Main serverless function
│   ├── recipe_generator.py    # Recipe generation logic
│   └── models.py              # Data models
├── requirements.txt            # Python dependencies
├── vercel.json                # Vercel configuration
├── env.example                # Environment variable template
└── README.md                  # This file
```

## License

MIT
