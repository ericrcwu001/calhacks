/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DefaultService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Chat completion with image recognition
     * Sends messages including images for analysis and receives JSON formatted responses
     * @param requestBody
     * @param xCreaoApiName API name identifier
     * @param xCreaoApiPath API path identifier
     * @param xCreaoApiId API ID identifier
     * @returns any Successful response with image analysis
     * @throws ApiError
     */
    public postV1AiZWwyutGgvEgWwzSaChatCompletions(
        requestBody: {
            messages: Array<{
                role: 'user';
                content: Array<({
                    type: 'text';
                    /**
                     * Text content for the message
                     */
                    text: string;
                } | {
                    type: 'image_url';
                    image_url: {
                        /**
                         * The URL of the image to analyze (variable field)
                         */
                        url: string;
                    };
                })>;
            }>;
            /**
             * Whether to stream the response
             */
            stream?: boolean;
        },
        xCreaoApiName: string = 'OpenAIGPTVision',
        xCreaoApiPath: string = '/v1/ai/zWwyutGgvEGWwzSa/chat/completions',
        xCreaoApiId: string = '68a5655cdeb2a0b2f64c013d',
    ): CancelablePromise<{
        /**
         * Unique identifier for the chat completion
         */
        id: string;
        choices: Array<{
            /**
             * The index of the choice in the list of choices
             */
            index: number;
            /**
             * Log probabilities (null if not requested)
             */
            logprobs?: any;
            message: {
                /**
                 * The role of the author of this message
                 */
                role: 'assistant';
                /**
                 * The contents of the message
                 */
                content: string;
                /**
                 * Reasoning content (null if not provided)
                 */
                reasoning_content?: any;
                /**
                 * Function call information (null if not applicable)
                 */
                function_call?: any;
                /**
                 * Tool calls information (null if not applicable)
                 */
                tool_calls?: any;
                /**
                 * Reasoning details (null if not provided)
                 */
                reasoning_details?: any;
            };
            /**
             * The reason the model stopped generating tokens
             */
            finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter';
            /**
             * Native finish reason (null if not applicable)
             */
            native_finish_reason?: any;
        }>;
        /**
         * The Unix timestamp (in seconds) when the chat completion was created
         */
        created: number;
        /**
         * The model used for the completion
         */
        model: string;
        /**
         * The object type, which is always 'chat.completion'
         */
        object: 'chat.completion';
        /**
         * System fingerprint (null if not provided)
         */
        system_fingerprint?: any;
        usage: {
            /**
             * Number of tokens in the prompt
             */
            prompt_tokens: number;
            /**
             * Number of tokens in the generated completion
             */
            completion_tokens: number;
            /**
             * Total number of tokens used in the request (prompt + completion)
             */
            total_tokens: number;
            completion_tokens_details?: {
                /**
                 * Number of reasoning tokens used
                 */
                reasoning_tokens?: number;
            };
            /**
             * Detailed breakdown of prompt tokens (null if not provided)
             */
            prompt_tokens_details?: any;
        };
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/v1/ai/zWwyutGgvEGWwzSa/chat/completions',
            headers: {
                'X-CREAO-API-NAME': xCreaoApiName,
                'X-CREAO-API-PATH': xCreaoApiPath,
                'X-CREAO-API-ID': xCreaoApiId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - invalid input parameters`,
                401: `Unauthorized - invalid or missing token`,
            },
        });
    }
}
