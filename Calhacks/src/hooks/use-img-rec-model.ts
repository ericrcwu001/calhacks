import { ImgRecogModel } from "@/components/api/schemas/ImgRecogModel/index";
import { getAuthToken } from "@/lib/auth-integration";
import { useMutation } from "@tanstack/react-query";

/**
 * Input interface for image recognition
 */
export interface ImgRecModelInput {
	/** Image file as a Blob (JPG format) */
	imageBlob: Blob;
}

/**
 * Food item detected in the image with nutritional information
 */
export interface RecognizedFoodItem {
	/** Food item label/name */
	label: string;
	/** Count of items detected */
	count: number;
	/** Total calories (kcal) for all items of this type */
	calories_kcal?: number;
	/** Total protein in grams for all items of this type */
	protein_g?: number;
	/** Total carbohydrates in grams for all items of this type */
	carbohydrates_g?: number;
	/** Total fat in grams for all items of this type */
	fat_g?: number;
	/** Total sodium in milligrams for all items of this type */
	sodium_mg?: number;
}

/**
 * Response structure for image recognition
 */
export interface ImgRecModelResponse {
	/** Array of recognized food items with nutritional info */
	items: RecognizedFoodItem[];
	/** Raw CSV data from the API */
	csvData?: string;
}

/**
 * Hook for recognizing food items in images using ImgRecModel API
 *
 * @example
 * ```tsx
 * const recognizeFood = useImgRecModelMutation();
 *
 * // Recognize foods from image blob
 * recognizeFood.mutate({
 *   imageBlob: jpegBlob,
 * }, {
 *   onSuccess: (data) => {
 *     console.log('Recognized items:', data.items);
 *   },
 *   onError: (error) => {
 *     console.error('Recognition failed:', error);
 *   }
 * });
 * ```
 */
export function useImgRecModelMutation() {
	return useMutation<ImgRecModelResponse, Error, ImgRecModelInput>({
		mutationFn: async (
			params: ImgRecModelInput,
		): Promise<ImgRecModelResponse> => {
			// Validate image blob
			if (!params.imageBlob || !(params.imageBlob instanceof Blob)) {
				throw new Error("Valid image Blob is required");
			}

			// Initialize API client with authentication
			const token = getAuthToken();
			if (!token) {
				throw new Error(
					"Authentication token is required. Please ensure you are logged in.",
				);
			}

			const apiClient = new ImgRecogModel({
				TOKEN: token,
			});

			console.log("[ImgRecModel] Calling API with image blob:", {
				size: params.imageBlob.size,
				type: params.imageBlob.type,
			});

			// Make API request with image
			const response = await apiClient.foodRecognition.recognizeFood({
				image: params.imageBlob,
			});

			console.log("[ImgRecModel] API response:", response);

			// Validate response
			if (!Array.isArray(response)) {
				throw new Error("Invalid response format from ImgRecModel API");
			}

			// Transform response to our format
			const items: RecognizedFoodItem[] = response.map((item) => ({
				label: item.label,
				count: item.count,
				calories_kcal: item.calories_kcal,
				protein_g: item.protein_g,
				carbohydrates_g: item.carbohydrates_g,
				fat_g: item.fat_g,
				sodium_mg: item.sodium_mg,
			}));

			return {
				items,
			};
		},
	});
}
