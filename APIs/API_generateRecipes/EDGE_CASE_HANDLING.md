# Edge Case Handling for Nutritional Data

## Overview

The Recipe Generation API now robustly handles all edge cases related to missing, null, or invalid nutritional information. The API will never crash or fail due to incomplete nutritional data.

## Edge Cases Handled

### 1. ✅ Missing Nutritional Fields

**Scenario:** Inventory items provided without any nutritional fields.

```json
{
  "inventory": [
    {
      "name": "Chicken Breast",
      "quantity": 500,
      "unit": "grams"
      // No nutritional data provided
    }
  ]
}
```

**Handling:** All nutritional fields default to `0.0`.

---

### 2. ✅ Null Values

**Scenario:** Nutritional fields explicitly set to `null`.

```json
{
  "inventory": [
    {
      "name": "Tofu",
      "quantity": 400,
      "unit": "grams",
      "calories_kcal": null,
      "protein_g": null,
      "carbohydrates_g": null
    }
  ]
}
```

**Handling:** Null values are converted to `0.0`.

---

### 3. ✅ Empty Strings

**Scenario:** Nutritional fields set to empty strings.

```json
{
  "inventory": [
    {
      "name": "Pasta",
      "quantity": 400,
      "unit": "grams",
      "calories_kcal": "",
      "protein_g": ""
    }
  ]
}
```

**Handling:** Empty strings are converted to `0.0`.

---

### 4. ✅ Invalid String Values

**Scenario:** Nutritional fields contain non-numeric strings.

```json
{
  "inventory": [
    {
      "name": "Rice",
      "quantity": 300,
      "unit": "grams",
      "protein_g": "invalid",
      "calories_kcal": "not a number"
    }
  ]
}
```

**Handling:** Invalid strings are safely converted to `0.0`.

---

### 5. ✅ String Numbers (Type Coercion)

**Scenario:** Nutritional fields provided as string numbers.

```json
{
  "inventory": [
    {
      "name": "Tomato Sauce",
      "quantity": 200,
      "unit": "ml",
      "calories_kcal": "50",
      "protein_g": "2.5"
    }
  ]
}
```

**Handling:** String numbers are automatically converted to float values (`"50"` → `50.0`).

---

### 6. ✅ Partial Nutritional Data

**Scenario:** Only some nutritional fields provided.

```json
{
  "inventory": [
    {
      "name": "Salmon",
      "quantity": 300,
      "unit": "grams",
      "calories_kcal": 206,
      "protein_g": 22.1,
      "fat_g": 12.4
      // carbohydrates_g, fiber_g, sugars_g, sodium_mg missing
    }
  ]
}
```

**Handling:** Missing fields default to `0.0`, provided fields use their actual values.

---

## Implementation Details

### Safe Value Extraction

The API uses a helper function `safe_float()` to safely extract numeric values:

```python
def safe_float(value, default=0.0):
    """Safely convert value to float, handling None, empty strings, and invalid values"""
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default
```

### Applied In Multiple Locations

1. **API Endpoint** (`api/generate_recipes.py`): When parsing request data
2. **Recipe Generator** (`api/recipe_generator.py`): When building AI prompts
3. **Standalone Function** (`api/recipe_generator.py`): When using the library directly

### Nutritional Fields Supported

All of the following fields are optional and handled gracefully:

- `calories_kcal` - Calories per serving in kcal
- `protein_g` - Protein content in grams
- `carbohydrates_g` - Carbohydrates in grams
- `fiber_g` - Fiber content in grams
- `sugars_g` - Sugar content in grams
- `fat_g` - Fat content in grams
- `sodium_mg` - Sodium content in milligrams

## Testing

Run the edge case tests:

```bash
python test_edge_cases.py
```

This will test:
1. Completely missing nutritional fields
2. Null nutritional values
3. Mixed nutritional data (some present, some missing)
4. Invalid nutritional values (strings, empty strings)

## API Behavior

- **No Crashes:** API will never crash due to missing nutritional data
- **Graceful Defaults:** Missing/invalid values default to 0.0
- **Type Safety:** All values are safely coerced to float
- **Recipe Generation:** Recipes are still generated even without nutritional data
- **AI Awareness:** The AI is provided with available nutritional info, uses 0 for missing data

## OpenAPI Specification

The OpenAPI spec (`openapi.json`) documents all nutritional fields as optional with default values of 0.

```json
{
  "calories_kcal": {
    "type": "number",
    "description": "Calories per serving in kcal (optional)",
    "minimum": 0,
    "default": 0
  }
}
```

## Best Practices

### For API Consumers

1. **Provide nutritional data when available** - It improves recipe quality and nutrition notes
2. **Omit fields you don't have** - Don't send null or empty values, just omit the field
3. **Use numeric types** - Send numbers as JSON numbers, not strings (though strings work too)

### Recommended Usage

**Good:**
```json
{
  "name": "Chicken",
  "quantity": 500,
  "unit": "grams",
  "calories_kcal": 165,
  "protein_g": 31.0
}
```

**Also Works:**
```json
{
  "name": "Chicken",
  "quantity": 500,
  "unit": "grams"
}
```

**Avoid (but handled gracefully):**
```json
{
  "name": "Chicken",
  "quantity": 500,
  "unit": "grams",
  "calories_kcal": null,
  "protein_g": "",
  "carbohydrates_g": "invalid"
}
```

## Error Scenarios That Still Fail

The API will still return errors for:

- Missing required fields: `name`, `quantity`, `unit`
- Invalid request format (malformed JSON)
- Empty inventory array
- Network/API key issues

But nutritional data will **never** cause failures.

---

**Last Updated:** October 26, 2025
**Status:** ✅ All edge cases handled

