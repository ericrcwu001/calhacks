import { OpenAIGPTChat } from "@/components/api/schemas/OpenAIGPTChat/index";
import { getAuthToken } from "@/lib/auth-integration";
import { useMutation } from "@tanstack/react-query";
import type { InventoryItem } from "./use-recipe-generator";

/**
 * Validation result from OpenAI
 */
export interface BundleValidationResult {
	/** Whether the bundle can be created */
	canCreate: boolean;
	/** Detailed explanation */
	explanation: string;
	/** Specific issues identified */
	issues: string[];
	/** Suggested maximum servings (if requested servings are too high) */
	suggestedMaxServings?: number;
}

/**
 * Input for bundle validation
 */
export interface ValidateBundleInput {
	/** Available inventory items */
	inventoryItems: InventoryItem[];
	/** TOTAL servings across ALL recipes (not per recipe) */
	totalServings: number;
	/** Number of recipes to generate */
	recipeCount?: number;
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
 * Build validation prompt for OpenAI
 */
function buildValidationPrompt(params: ValidateBundleInput): {
	system: string;
	user: string;
} {
	const { totalServings, recipeCount = 3 } = params;

	const systemPrompt = `You are an expert food inventory analyst for a food bank. Your job is to carefully assess whether the available inventory is sufficient to create the requested number of TOTAL servings across ALL recipes.

IMPORTANT VALIDATION RULES:
1. Check TOTAL QUANTITIES: Ensure there's enough of each ingredient for ${totalServings} TOTAL servings across ALL ${recipeCount} recipes combined
2. Check INGREDIENT DIVERSITY: Verify there are enough different types of ingredients to create ${recipeCount} distinct, complete meals
3. Check SERVING RATIOS: For ${totalServings} TOTAL servings, typical requirements are:
   - Protein: ~150-200g per serving (so ${totalServings * 150}-${totalServings * 200}g total needed)
   - Carbs/Grains: ~200-250g per serving (so ${totalServings * 200}-${totalServings * 250}g total needed)
   - Vegetables: ~150-200g per serving (so ${totalServings * 150}-${totalServings * 200}g total needed)
4. Check RECIPE FEASIBILITY: Can ${recipeCount} complete, distinct recipes be made with available items?
5. Account for UNIT CONVERSIONS: Consider that items in "ea" (each) may have different weights

CRITICAL CHECKS:
✓ Total protein sources sufficient for ${totalServings} TOTAL servings across all recipes?
✓ Total carbohydrate sources sufficient for ${totalServings} TOTAL servings across all recipes?
✓ Total vegetables/produce sufficient for ${totalServings} TOTAL servings across all recipes?
✓ Enough variety for ${recipeCount} different recipes?
✓ Seasonings/condiments available?

Return your analysis in this EXACT JSON format:
{
  "canCreate": boolean,
  "explanation": "ONE CONCISE PARAGRAPH (2-3 sentences max) explaining why this cannot be done. Be brief and direct.",
  "issues": ["Specific issue 1", "Specific issue 2", ...],
  "suggestedMaxServings": number (only if canCreate is false, suggest max realistic TOTAL servings)
}`;

	const inventoryList = params.inventoryItems
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

	const userMessage = `Available Inventory:
${inventoryList}

REQUEST: Generate ${recipeCount} recipes that provide ${totalServings} TOTAL servings (combined across all ${recipeCount} recipes, NOT per recipe).

Please analyze whether the above inventory is sufficient to create ${recipeCount} complete, nutritionally balanced recipes that provide ${totalServings} TOTAL servings across all recipes combined. Consider:
1. Total ingredient quantities needed for ${totalServings} servings
2. Variety of ingredients available
3. Typical serving sizes for a balanced meal
4. Whether there are enough different ingredients to make ${recipeCount} distinct recipes

Be strict and realistic in your assessment. If there's not enough food, say so clearly in ONE CONCISE PARAGRAPH (2-3 sentences maximum).`;

	return {
		system: systemPrompt,
		user: userMessage,
	};
}

/**
 * Hook for validating bundle generation with OpenAI
 *
 * This hook asks OpenAI to analyze the inventory and determine if there are
 * enough ingredients to create the requested TOTAL number of servings across all recipes.
 *
 * @example
 * ```tsx
 * const validateBundle = useBundleValidatorMutation();
 *
 * validateBundle.mutate({
 *   inventoryItems: inventory,
 *   totalServings: 400, // TOTAL servings across ALL recipes
 *   recipeCount: 3,
 * }, {
 *   onSuccess: (result) => {
 *     if (result.canCreate) {
 *       console.log('Validation passed!');
 *     } else {
 *       console.log('Validation failed:', result.issues);
 *     }
 *   }
 * });
 * ```
 */
export function useBundleValidatorMutation() {
	return useMutation<BundleValidationResult, Error, ValidateBundleInput>({
		mutationFn: async (
			params: ValidateBundleInput,
		): Promise<BundleValidationResult> => {
			// Validate input
			if (!params.inventoryItems || params.inventoryItems.length === 0) {
				throw new Error("At least one inventory item is required");
			}

			if (params.totalServings < 1) {
				throw new Error("Total servings must be at least 1");
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

			// Build validation prompts
			const { system, user } = buildValidationPrompt(params);

			// Make API request
			const response: ChatApiResponse =
				await apiClient.default.createChatCompletion({
					model: "gpt-4",
					messages: [
						{
							role: "system",
							content: system,
						},
						{
							role: "user",
							content: user,
						},
					],
				});

			// Validate response structure
			if (!response.choices || response.choices.length === 0) {
				throw new Error("No response from validation API");
			}

			const messageContent = response.choices[0].message.content;
			if (!messageContent) {
				throw new Error("Empty response from validation API");
			}

			// Parse JSON response
			try {
				// Extract JSON from markdown code blocks if present
				let jsonContent = messageContent;
				const jsonMatch = messageContent.match(
					/```(?:json)?\s*(\{[\s\S]*\})\s*```/,
				);
				if (jsonMatch) {
					jsonContent = jsonMatch[1];
				}

				const validationResult = JSON.parse(
					jsonContent,
				) as BundleValidationResult;

				// Validate result structure
				if (typeof validationResult.canCreate !== "boolean") {
					throw new Error("Invalid validation result: missing canCreate field");
				}

				if (
					!validationResult.explanation ||
					typeof validationResult.explanation !== "string"
				) {
					throw new Error(
						"Invalid validation result: missing explanation field",
					);
				}

				if (
					!validationResult.issues ||
					!Array.isArray(validationResult.issues)
				) {
					throw new Error("Invalid validation result: missing issues array");
				}

				return validationResult;
			} catch (parseError) {
				console.error("Failed to parse validation response:", messageContent);
				throw new Error(
					`Failed to parse validation results: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
				);
			}
		},
	});
}
