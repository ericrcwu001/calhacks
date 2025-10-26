/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class SystemService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Health Check
     * Check if the API is running and connected to Open Food Facts
     * @param xCreaoApiName API name identifier
     * @param xCreaoApiPath API path identifier
     * @param xCreaoApiId API ID identifier
     * @returns any API is healthy
     * @throws ApiError
     */
    public healthCheck(
        xCreaoApiName: string = 'openFoodFacts',
        xCreaoApiPath: string = '/v1/health',
        xCreaoApiId: string = '68fc7aa38ff3b2a357d57253',
    ): CancelablePromise<{
        status?: string;
        upstream?: string;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/health',
            headers: {
                'X-CREAO-API-NAME': xCreaoApiName,
                'X-CREAO-API-PATH': xCreaoApiPath,
                'X-CREAO-API-ID': xCreaoApiId,
            },
        });
    }
}
