import { useMutation } from "@tanstack/react-query";

/**
 * Input interface for OpenFoodFacts barcode lookup
 */
export interface OpenFoodFactsInput {
	/** Barcode number to look up */
	code: string;
}

/**
 * Product ingredient detail
 */
export interface ProductIngredient {
	id: string;
	text: string;
	vegan?: string;
	vegetarian?: string;
	percent_estimate?: number | string;
}

/**
 * This is the actual structure of the product data your API returns.
 */
export interface OpenFoodFactsProduct {
	code: string;
	product_name_en?: string;
	generic_name_en?: string;
	quantity?: string;
	product_quantity?: number;
	product_quantity_unit?: string;
	serving_size?: string;
	serving_quantity?: number;
	serving_quantity_unit?: string;
	ingredients?: ProductIngredient[];
	ingredients_text_en?: string;
	ingredients_analysis_tags?: string[];
	allergens_tags?: string[];
	image_url?: string;
	source: string;
	// Nutritional data fields
	brand?: string;
	category?: string;
	calories?: number;
	protein?: number;
	carbohydrates?: number;
	fiber?: number;
	sugars?: number;
	fat?: number;
	sodium?: number;
}

/**
 * A corrected hook that calls your Vercel API directly.
 *
 * @example
 * ```tsx
 * const lookupBarcode = useOpenFoodFactsMutation();
 *
 * // Look up a barcode
 * lookupBarcode.mutate({
 *   code: '50184453',
 * }, {
 *   onSuccess: (product) => {
 *     console.log('Product found:', product.product_name_en);
 *   },
 *   onError: (error) => {
 *     console.error('Lookup failed:', error);
 *   }
 * });
 * ```
 */
export function useOpenFoodFactsMutation() {
	const API_BASE_URL =
		"https://openfoodfacts-m2wolzz35-erics-projects-17f00cbc.vercel.app";

	return useMutation<OpenFoodFactsProduct, Error, OpenFoodFactsInput>({
		mutationFn: async (
			params: OpenFoodFactsInput,
		): Promise<OpenFoodFactsProduct> => {
			// Validate barcode
			if (!params.code || typeof params.code !== "string") {
				throw new Error("Valid barcode is required");
			}
			const barcode = params.code.trim();
			if (barcode.length === 0) {
				throw new Error("Barcode cannot be empty");
			}
			if (!/^\d+$/.test(barcode)) {
				throw new Error("Barcode must contain only numbers");
			}

			const endpointUrl = `${API_BASE_URL}/v1/products/${barcode}`;

			try {
				console.log(`[OpenFoodFacts] Calling API directly: ${endpointUrl}`);
				const response = await fetch(endpointUrl);

				if (!response.ok) {
					try {
						const errorData = await response.json();
						const detail =
							errorData.detail ||
							`API request failed with status ${response.status}`;
						// Customize error for "not found"
						if (response.status === 404) {
							throw new Error(
								`No product found for barcode: ${barcode}. This product may not be in the OpenFoodFacts database.`,
							);
						}
						throw new Error(detail);
					} catch (e) {
						throw new Error(
							`API request failed with status ${response.status}`,
						);
					}
				}

				const productData: OpenFoodFactsProduct = await response.json();

				if (!productData || !productData.code) {
					throw new Error(`No product found for barcode: ${barcode}.`);
				}

				console.log("[OpenFoodFacts] Success! Found product:", {
					code: productData.code,
					name: productData.product_name_en,
					imageUrl: productData.image_url,
					brand: productData.brand,
					category: productData.category,
					nutritionalData: {
						calories: productData.calories,
						protein: productData.protein,
						carbohydrates: productData.carbohydrates,
						fiber: productData.fiber,
						sugars: productData.sugars,
						fat: productData.fat,
						sodium: productData.sodium,
					},
				});

				return productData;
			} catch (error) {
				console.error("[OpenFoodFacts] Direct API call failed:", error);
				if (error instanceof Error) {
					// Re-throw the specific error for the UI to handle
					throw error;
				}
				throw new Error("An unknown error occurred during the API call.");
			}
		},
	});
}
