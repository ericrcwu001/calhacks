/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class FoodRecognitionService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Recognize Food Items in Image
     * Upload an image containing food items to identify them, count quantities, and retrieve nutritional information. Returns CSV format with food items, counts, and nutritional data including calories, protein, carbohydrates, fat, and sodium.
     * @param formData
     * @param xCreaoApiName API name identifier
     * @param xCreaoApiPath API path identifier
     * @param xCreaoApiId API ID identifier
     * @returns any Food items successfully identified and analyzed
     * @throws ApiError
     */
    public recognizeFood(
        formData: {
            /**
             * Image file containing food items
             */
            image: Blob;
        },
        xCreaoApiName: string = 'ImgRecogModel',
        xCreaoApiPath: string = '/api/image-recognition',
        xCreaoApiId: string = '68fd7f226090ce71048eed26',
    ): CancelablePromise<Array<{
        /**
         * Name of the food item
         */
        label: string;
        /**
         * Number of this food item detected
         */
        count: number;
        /**
         * Total calories (kcal) for all items of this type
         */
        calories_kcal?: number;
        /**
         * Total protein in grams for all items of this type
         */
        protein_g?: number;
        /**
         * Total carbohydrates in grams for all items of this type
         */
        carbohydrates_g?: number;
        /**
         * Total fat in grams for all items of this type
         */
        fat_g?: number;
        /**
         * Total sodium in milligrams for all items of this type
         */
        sodium_mg?: number;
    }>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/image-recognition',
            headers: {
                'X-CREAO-API-NAME': xCreaoApiName,
                'X-CREAO-API-PATH': xCreaoApiPath,
                'X-CREAO-API-ID': xCreaoApiId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad request - no image provided or invalid image format`,
                500: `Server error occurred during image processing`,
            },
        });
    }
}
