# Creao - AI-Powered Food Bank Management System

A comprehensive food bank management system that leverages AI to streamline inventory management, food recognition, and recipe generation. Built with React, TypeScript, and integrated with multiple AI services.

## 🚀 Live Demo

**[Try Creao Now](https://production.creao.ai/share?app=TW8zO4eq&utm_source=share&utm_medium=link)**

## ✨ Key Features

### 📦 Smart Inventory Management
- **Real-time inventory tracking** with quantity management
- **Advanced filtering** by dietary preferences and allergens
- **Low stock alerts** and automated notifications
- **Nutritional information** display for each item
- **Image support** with automatic product photos

### 📸 AI-Powered Food Recognition
- **Barcode scanning** with OpenFoodFacts integration
- **Computer vision** for automatic food detection from photos
- **Nutritional analysis** using ImgRecModel AI
- **Product information** lookup with detailed nutritional data
- **Allergen detection** and dietary tag classification

### 🍳 Intelligent Recipe Generation
- **AI-generated recipes** based on available inventory
- **Dietary restriction support** (vegetarian, vegan, gluten-free, etc.)
- **Serving size optimization** with inventory validation
- **Recipe bundling** for efficient meal planning
- **Automatic ingredient deduction** when recipes are used

### 🔧 Technical Features
- **Modern React architecture** with TypeScript
- **Responsive design** optimized for mobile and desktop
- **Real-time data synchronization** with local storage
- **RESTful API integration** with multiple AI services
- **Comprehensive error handling** and user feedback

## 🏗️ Architecture

### Frontend (Creao_Codebase)
- **React 19** with TypeScript
- **TanStack Router** for navigation
- **TanStack Query** for data management
- **Radix UI** components with Tailwind CSS
- **Local storage** with IndexedDB for offline capability

### Backend APIs
- **Recipe Generation API** - Google Gemini AI integration
- **OpenFoodFacts API** - Product database integration

## 🚀 Getting Started

### API Setup

#### Recipe Generation API
```bash
cd APIs/API_generateRecipes
pip install -r requirements.txt
# Set GOOGLE_API_KEY environment variable
```

#### OpenFoodFacts API
```bash
cd APIs/API_openFoodFacts
npm install
# Deploy to Vercel
```

## 📱 Usage Guide

### Adding Items to Inventory
1. **Camera Tab**: Take photos of food items for AI recognition
2. **Barcode Tab**: Enter product barcodes for instant lookup
3. **Review**: Edit detected information before saving
4. **Save**: Items are automatically added to inventory

### Managing Inventory
1. **View Items**: Browse all inventory with search and filters
2. **Adjust Quantities**: Use quick adjust buttons or set exact amounts
3. **Nutritional Info**: View detailed nutritional data for each item
4. **Allergen Warnings**: See allergen information and dietary tags

### Generating Recipes
1. **Recipes Tab**: Access the recipe generation interface
2. **Set Servings**: Specify total number of servings needed
3. **AI Generation**: System generates 3 unique recipes from available inventory
4. **Review Recipes**: Check ingredients and cooking instructions
5. **Make Recipe**: Deduct ingredients from inventory when cooking

## 🔧 Configuration

### Environment Variables
```bash
# Recipe Generation API
GOOGLE_API_KEY=your_google_api_key
API_KEY=your_optional_api_key

# Barcode Scanner API
GOOGLE_APPLICATION_CREDENTIALS=path_to_service_account.json

# OpenFoodFacts API
# No authentication required
```

### API Endpoints
- **Recipe Generation**: `POST /api/generate_recipes`
- **OpenFoodFacts**: `GET /v1/products/{barcode}`

## 🛠️ Development

### Project Structure
```
calhacks/
├── Creao_Codebase/          # React frontend application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── routes/          # Application routes
│   │   └── lib/             # Utilities and types
├── APIs/                    # Backend API services
│   ├── API_generateRecipes/ # Recipe generation service
│   └── API_openFoodFacts/   # Product lookup service
```

### Available Scripts
```bash
# Frontend development
npm run dev          # Start development server
npm run build        # Build for production
npm run check        # Run type checking and linting
npm run test         # Run test suite

# API development
python main.py       # Start API server
python test_api.py   # Run API tests
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenFoodFacts** for comprehensive product database
- **Google Gemini AI** for intelligent recipe generation
- **ImgRecModel** for nutritional analysis
- **Creao** platform for rapid application development

---

**Built with ❤️ for food banks and community organizations**
