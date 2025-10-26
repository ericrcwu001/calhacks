import { OpenAIGPTChat } from "@/components/api/schemas/OpenAIGPTChat/index";
import { getAuthToken } from "@/lib/auth-integration";
import { useMutation } from "@tanstack/react-query";

/**
 * Inventory item available for recipes
 */
export interface InventoryItem {
	/** Item identifier */
	item_id: string;
	/** Item name/label */
	name: string;
	/** Available quantity */
	quantity: number;
	/** Unit of measurement (e.g., "ea", "lb", "kg") */
	unit?: string;
	/** Optional category (e.g., "produce", "dairy", "protein") */
	category?: string;
}

/**
 * Input interface for recipe generation
 */
export interface GenerateRecipesInput {
	/** List of available inventory items */
	inventoryItems: InventoryItem[];
	/** Number of recipes to generate */
	recipeCount?: number;
	/** Dietary restrictions or preferences */
	dietaryRestrictions?: string[];
	/** Target servings per recipe */
	servingsPerRecipe?: number;
	/** Optional custom instructions */
	customInstructions?: string;
	/** Previously generated recipes to exclude (for regeneration) */
	excludedRecipes?: RecipeSuggestion[];
}

/**
 * Recipe item with quantity needed
 */
export interface RecipeItem {
	/** Reference to inventory item ID */
	item_id: string;
	/** Quantity needed for this recipe */
	qty: number;
	/** Unit of measurement */
	unit: string;
}

/**
 * Individual recipe suggestion
 */
export interface RecipeSuggestion {
	/** Recipe title/name */
	title: string;
	/** Description of the recipe */
	description: string;
	/** List of items needed with quantities */
	items: RecipeItem[];
	/** Optional preparation instructions */
	instructions?: string[];
	/** Estimated preparation time in minutes */
	prepTime?: number;
	/** Estimated cooking time in minutes */
	cookTime?: number;
	/** Number of servings */
	servings?: number;
}

/**
 * Response structure for recipe generation
 */
export interface GenerateRecipesResponse {
	/** Array of recipe suggestions */
	recipes: RecipeSuggestion[];
}

/**
 * Raw API response from OpenAI GPT Chat
 */
interface ChatApiResponse {
	id: string;
	object: "chat.completion";
	created: number;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: "assistant";
			content: string;
		};
		finish_reason:
			| "stop"
			| "length"
			| "function_call"
			| "content_filter"
			| "null";
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

/**
 * Build the system prompt for recipe generation
 */
function buildSystemPrompt(params: GenerateRecipesInput): string {
	const {
		recipeCount = 3,
		servingsPerRecipe = 4,
		dietaryRestrictions = [],
		excludedRecipes = [],
	} = params;

	let prompt =
		"You are a helpful assistant that generates recipe bundles for food bank distribution.";

	if (dietaryRestrictions.length > 0) {
		prompt += ` Consider these dietary restrictions: ${dietaryRestrictions.join(", ")}.`;
	}

	prompt += `\n\nGenerate ${recipeCount} complete recipe suggestions, each serving ${servingsPerRecipe} people.`;

	// Add exclusion instruction if there are previously generated recipes
	if (excludedRecipes.length > 0) {
		prompt +=
			"\n\n⚠️ IMPORTANT: The user is regenerating recipes. You MUST generate DIFFERENT recipes from the following previously generated ones. Do NOT repeat any of these recipe titles or their core concepts:";
		for (const recipe of excludedRecipes) {
			prompt += `\n- "${recipe.title}": ${recipe.description}`;
		}
		prompt +=
			"\n\nEnsure your new recipes are distinct in both concept and ingredients used.";
	}

	prompt += `\n\nFor each recipe, provide:
1. A descriptive title
2. A brief description
3. Exact items needed with quantities from the available inventory
4. Optional: step-by-step instructions
5. Optional: preparation and cooking times

⚠️ CRITICAL UNIT MATCHING RULES:
- When using inventory items, you MUST specify quantities using "ea" (each) or "each" as the unit
- For example: {"item_id": "flour_id", "qty": 2, "unit": "ea"} means "2 units of flour"
- DO NOT use weight/volume units like "g", "kg", "ml", "l" in the recipe items
- ALWAYS use "ea" to indicate how many units of an inventory item to use
- Each inventory item may have a size (e.g., "200g" per unit), but recipes should specify quantity in units (ea), not weight

Return the results in this exact JSON format:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "description": "Brief description",
      "items": [
        {"item_id": "inventory_item_id", "qty": number, "unit": "ea"}
      ],
      "instructions": ["Step 1", "Step 2", ...],
      "prepTime": minutes,
      "cookTime": minutes,
      "servings": number
    }
  ]
}`;

	if (params.customInstructions) {
		prompt += `\n\nAdditional instructions: ${params.customInstructions}`;
	}

	return prompt;
}

/**
 * Build the user message with inventory data
 */
function buildUserMessage(inventoryItems: InventoryItem[]): string {
	const inventoryList = inventoryItems
		.map((item) => {
			const parts = [
				`- ${item.name}`,
				`(ID: ${item.item_id})`,
				`: ${item.quantity}`,
				item.unit || "units",
			];
			if (item.category) {
				parts.push(`[${item.category}]`);
			}
			return parts.join(" ");
		})
		.join("\n");

	return `Here is the available inventory:\n\n${inventoryList}\n\nPlease generate recipe bundles using these items.`;
}

/**
 * Hook for generating recipe bundles from inventory using OpenAI GPT Chat
 *
 * @example
 * ```tsx
 * const generateRecipes = useRecipeGeneratorMutation();
 *
 * // Generate recipes from inventory
 * generateRecipes.mutate({
 *   inventoryItems: [
 *     { item_id: '1', name: 'Rice', quantity: 10, unit: 'lb' },
 *     { item_id: '2', name: 'Chicken', quantity: 5, unit: 'lb' },
 *     { item_id: '3', name: 'Carrots', quantity: 3, unit: 'lb' },
 *   ],
 *   recipeCount: 3,
 *   servingsPerRecipe: 4,
 *   dietaryRestrictions: ['gluten-free'],
 * }, {
 *   onSuccess: (data) => {
 *     console.log('Generated recipes:', data.recipes);
 *   },
 *   onError: (error) => {
 *     console.error('Recipe generation failed:', error);
 *   }
 * });
 * ```
 */
export function useRecipeGeneratorMutation() {
	return useMutation<GenerateRecipesResponse, Error, GenerateRecipesInput>({
		mutationFn: async (
			params: GenerateRecipesInput,
		): Promise<GenerateRecipesResponse> => {
			// Validate inventory items
			if (!params.inventoryItems || !Array.isArray(params.inventoryItems)) {
				throw new Error("Valid inventory items array is required");
			}

			if (params.inventoryItems.length === 0) {
				throw new Error("At least one inventory item is required");
			}

			// Validate each inventory item
			for (const item of params.inventoryItems) {
				if (!item.item_id || typeof item.item_id !== "string") {
					throw new Error("Each inventory item must have a valid item_id");
				}
				if (!item.name || typeof item.name !== "string") {
					throw new Error("Each inventory item must have a valid name");
				}
				if (typeof item.quantity !== "number" || item.quantity < 0) {
					throw new Error(
						"Each inventory item must have a valid non-negative quantity",
					);
				}
			}

			// Validate optional parameters
			if (params.recipeCount !== undefined) {
				if (typeof params.recipeCount !== "number" || params.recipeCount < 1) {
					throw new Error("Recipe count must be a positive number");
				}
			}

			if (params.servingsPerRecipe !== undefined) {
				if (
					typeof params.servingsPerRecipe !== "number" ||
					params.servingsPerRecipe < 1
				) {
					throw new Error("Servings per recipe must be a positive number");
				}
			}

			// Initialize API client with authentication
			const token = getAuthToken();
			if (!token) {
				throw new Error(
					"Authentication token is required. Please ensure you are logged in.",
				);
			}

			const apiClient = new OpenAIGPTChat({
				TOKEN: token,
			});

			// Build prompts
			const systemPrompt = buildSystemPrompt(params);
			const userMessage = buildUserMessage(params.inventoryItems);

			// Make API request
			const response: ChatApiResponse =
				await apiClient.default.createChatCompletion({
					model: "gpt-4",
					messages: [
						{
							role: "system",
							content: systemPrompt,
						},
						{
							role: "user",
							content: userMessage,
						},
					],
				});

			// Validate response structure
			if (!response.choices || response.choices.length === 0) {
				throw new Error("No response from chat API");
			}

			const messageContent = response.choices[0].message.content;
			if (!messageContent) {
				throw new Error("Empty response from chat API");
			}

			// Parse JSON response from the model
			try {
				// Extract JSON from markdown code blocks if present
				let jsonContent = messageContent;
				const jsonMatch = messageContent.match(
					/```(?:json)?\s*(\{[\s\S]*\})\s*```/,
				);
				if (jsonMatch) {
					jsonContent = jsonMatch[1];
				}

				const parsedResponse = JSON.parse(
					jsonContent,
				) as GenerateRecipesResponse;

				// Validate response structure
				if (!parsedResponse.recipes || !Array.isArray(parsedResponse.recipes)) {
					throw new Error("Invalid response format: missing recipes array");
				}

				if (parsedResponse.recipes.length === 0) {
					throw new Error("No recipes were generated");
				}

				// Validate each recipe
				for (const recipe of parsedResponse.recipes) {
					if (!recipe.title || typeof recipe.title !== "string") {
						throw new Error("Invalid recipe: missing or invalid title");
					}
					if (!recipe.description || typeof recipe.description !== "string") {
						throw new Error("Invalid recipe: missing or invalid description");
					}
					if (!recipe.items || !Array.isArray(recipe.items)) {
						throw new Error("Invalid recipe: missing or invalid items array");
					}

					// Validate recipe items
					for (const recipeItem of recipe.items) {
						if (!recipeItem.item_id || typeof recipeItem.item_id !== "string") {
							throw new Error(
								"Invalid recipe item: missing or invalid item_id",
							);
						}
						if (typeof recipeItem.qty !== "number" || recipeItem.qty <= 0) {
							throw new Error(
								"Invalid recipe item: quantity must be a positive number",
							);
						}
						if (!recipeItem.unit || typeof recipeItem.unit !== "string") {
							throw new Error("Invalid recipe item: missing or invalid unit");
						}

						// Verify item_id exists in inventory
						const inventoryItem = params.inventoryItems.find(
							(inv) => inv.item_id === recipeItem.item_id,
						);
						if (!inventoryItem) {
							console.warn(
								`Recipe references unknown item_id: ${recipeItem.item_id}`,
							);
						}
					}
				}

				return parsedResponse;
			} catch (parseError) {
				console.error("Failed to parse chat API response:", messageContent);
				throw new Error(
					`Failed to parse recipe generation results: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
				);
			}
		},
	});
}
