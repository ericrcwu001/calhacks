"""
Data models for recipe generation.
Defines dataclasses for inventory items and recipes.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any


# Recipe engine models
@dataclass
class InventoryItem:
    """Temporary inventory item format for recipe generation"""
    id: str
    name: str
    category: str
    quantity: float
    unit: str
    # Nutritional information per serving (all optional with defaults)
    calories_kcal: float = 0.0
    protein_g: float = 0.0
    carbohydrates_g: float = 0.0
    fiber_g: float = 0.0
    sugars_g: float = 0.0
    fat_g: float = 0.0
    sodium_mg: float = 0.0
    tags: List[str] = field(default_factory=list)
    allergens: List[str] = field(default_factory=list)
    certifications: List[str] = field(default_factory=list)


@dataclass
class RecipeIngredient:
    """Recipe ingredient"""
    inventory_item_id: str
    name: str
    quantity: int  # Changed to int for integer quantities only
    unit: str


@dataclass
class InventoryDepletion:
    """Tracks inventory used in recipe"""
    id: str
    quantity: int  # Changed to int for integer quantities only
    unit: str


@dataclass
class Recipe:
    """Generated recipe"""
    title: str
    description: str
    servings: int
    prep_time_minutes: int
    ingredients: List[RecipeIngredient]
    instructions: List[str]
    equipment: List[str] = field(default_factory=list)
    nutrition_notes: List[str] = field(default_factory=list)
    dietary_tags: List[str] = field(default_factory=list)
    inventory_depletion_summary: List[InventoryDepletion] = field(default_factory=list)
    substitutions: List[str] = field(default_factory=list)
    packaging: str = "Container"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "title": self.title,
            "description": self.description,
            "servings": self.servings,
            "prep_time_minutes": self.prep_time_minutes,
            "ingredients": [
                {
                    "inventory_item_id": ing.inventory_item_id,
                    "name": ing.name,
                    "quantity": ing.quantity,
                    "unit": ing.unit
                }
                for ing in self.ingredients
            ],
            "instructions": self.instructions,
            "nutrition_notes": self.nutrition_notes,
            "dietary_tags": self.dietary_tags,
            "inventory_depletion_summary": [
                {
                    "id": depl.id,
                    "quantity": depl.quantity,
                    "unit": depl.unit
                }
                for depl in self.inventory_depletion_summary
            ],
            "substitutions": self.substitutions
        }
