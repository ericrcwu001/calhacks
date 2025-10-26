import { OpenAIGPTVision } from "@/components/api/schemas/OpenAIGPTVision/index";
import { getAuthToken } from "@/lib/auth-integration";
import { useMutation } from "@tanstack/react-query";

/**
 * Input interface for food classification
 */
export interface ClassifyFoodsInput {
	/** Image data as base64 string or data URL */
	imageUrl: string;
	/** Optional custom prompt to guide classification */
	customPrompt?: string;
}

/**
 * Individual food item detected in the image
 */
export interface DetectedFoodItem {
	/** Food item label/name */
	label: string;
	/** Estimated quantity */
	quantity: number;
	/** Confidence score (0-1) */
	confidence: number;
}

/**
 * Response structure for food classification
 */
export interface ClassifyFoodsResponse {
	/** Array of detected food items */
	items: DetectedFoodItem[];
	/** Timestamp when the frame was processed */
	frame_ts: string;
}

/**
 * Raw API response from OpenAI GPT Vision
 */
interface VisionApiResponse {
	id: string;
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
			| "tool_calls"
			| "content_filter";
	}>;
	created: number;
	model: string;
	object: "chat.completion";
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

/**
 * Default prompt for food classification
 */
const DEFAULT_CLASSIFICATION_PROMPT = `Analyze this image and identify all food items visible. For each item, provide:
1. A clear label/name of the food item
2. An estimated quantity (count or approximate amount)
3. Your confidence level (0-1 scale)

Return the results in this exact JSON format:
{
  "items": [
    {"label": "item name", "quantity": number, "confidence": 0.0-1.0}
  ],
  "frame_ts": "ISO 8601 timestamp"
}`;

/**
 * Hook for classifying food items from camera images using OpenAI GPT Vision
 *
 * @example
 * ```tsx
 * const classifyFoods = useClassifyFoodsMutation();
 *
 * // Classify foods from image
 * classifyFoods.mutate({
 *   imageUrl: 'data:image/jpeg;base64,...',
 * }, {
 *   onSuccess: (data) => {
 *     console.log('Detected items:', data.items);
 *   },
 *   onError: (error) => {
 *     console.error('Classification failed:', error);
 *   }
 * });
 * ```
 */
export function useClassifyFoodsMutation() {
	return useMutation<ClassifyFoodsResponse, Error, ClassifyFoodsInput>({
		mutationFn: async (
			params: ClassifyFoodsInput,
		): Promise<ClassifyFoodsResponse> => {
			// Validate image URL
			if (!params.imageUrl || typeof params.imageUrl !== "string") {
				throw new Error("Valid image URL is required");
			}

			// Validate image URL format (base64 or http/https URL)
			const isDataUrl = params.imageUrl.startsWith("data:image/");
			const isHttpUrl =
				params.imageUrl.startsWith("http://") ||
				params.imageUrl.startsWith("https://");

			if (!isDataUrl && !isHttpUrl) {
				throw new Error(
					"Image URL must be a data URL (base64) or HTTP/HTTPS URL",
				);
			}

			// Initialize API client with authentication
			const token = getAuthToken();
			if (!token) {
				throw new Error(
					"Authentication token is required. Please ensure you are logged in.",
				);
			}

			const apiClient = new OpenAIGPTVision({
				TOKEN: token,
			});

			// Prepare the prompt
			const prompt = params.customPrompt || DEFAULT_CLASSIFICATION_PROMPT;

			// Make API request with image
			const response: VisionApiResponse =
				await apiClient.default.postV1AiZWwyutGgvEgWwzSaChatCompletions({
					messages: [
						{
							role: "user",
							content: [
								{
									type: "text",
									text: prompt,
								},
								{
									type: "image_url",
									image_url: {
										url: params.imageUrl,
									},
								},
							],
						},
					],
					stream: false,
				});

			// Validate response structure
			if (!response.choices || response.choices.length === 0) {
				throw new Error("No response from vision API");
			}

			const messageContent = response.choices[0].message.content;
			if (!messageContent) {
				throw new Error("Empty response from vision API");
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

				const parsedResponse = JSON.parse(jsonContent) as ClassifyFoodsResponse;

				// Validate response structure
				if (!parsedResponse.items || !Array.isArray(parsedResponse.items)) {
					throw new Error("Invalid response format: missing items array");
				}

				// Validate each item
				for (const item of parsedResponse.items) {
					if (!item.label || typeof item.label !== "string") {
						throw new Error("Invalid item: missing or invalid label");
					}
					if (typeof item.quantity !== "number" || item.quantity < 0) {
						throw new Error("Invalid item: missing or invalid quantity");
					}
					if (
						typeof item.confidence !== "number" ||
						item.confidence < 0 ||
						item.confidence > 1
					) {
						throw new Error("Invalid item: confidence must be between 0 and 1");
					}
				}

				// Add timestamp if not provided
				if (!parsedResponse.frame_ts) {
					parsedResponse.frame_ts = new Date().toISOString();
				}

				return parsedResponse;
			} catch (parseError) {
				console.error("Failed to parse vision API response:", messageContent);
				throw new Error(
					`Failed to parse classification results: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
				);
			}
		},
	});
}
