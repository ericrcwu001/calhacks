/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Product } from '../models/Product';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ProductsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get Product by Barcode
     * Retrieve normalized product information for a specific barcode
     * @param barcode Product barcode (EAN-13, UPC, etc.)
     * @param xCreaoApiName API name identifier
     * @param xCreaoApiPath API path identifier
     * @param xCreaoApiId API ID identifier
     * @returns Product Product found
     * @throws ApiError
     */
    public getProductByBarcode(
        barcode: string,
        xCreaoApiName: string = 'openFoodFacts',
        xCreaoApiPath: string = '/v1/health',
        xCreaoApiId: string = '68fc7aa38ff3b2a357d57253',
    ): CancelablePromise<Product> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/products/{barcode}',
            path: {
                'barcode': barcode,
            },
            headers: {
                'X-CREAO-API-NAME': xCreaoApiName,
                'X-CREAO-API-PATH': xCreaoApiPath,
                'X-CREAO-API-ID': xCreaoApiId,
            },
            errors: {
                404: `Product not found`,
                502: `Upstream service error`,
            },
        });
    }
    /**
     * Get Multiple Products
     * Retrieve normalized product information for multiple barcodes
     * @param codes Comma-separated list of product barcodes
     * @param xCreaoApiName API name identifier
     * @param xCreaoApiPath API path identifier
     * @param xCreaoApiId API ID identifier
     * @returns Product Products found
     * @throws ApiError
     */
    public getProducts(
        codes: string,
        xCreaoApiName: string = 'openFoodFacts',
        xCreaoApiPath: string = '/v1/health',
        xCreaoApiId: string = '68fc7aa38ff3b2a357d57253',
    ): CancelablePromise<Array<Product>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/products',
            headers: {
                'X-CREAO-API-NAME': xCreaoApiName,
                'X-CREAO-API-PATH': xCreaoApiPath,
                'X-CREAO-API-ID': xCreaoApiId,
            },
            query: {
                'codes': codes,
            },
            errors: {
                400: `Bad request - missing or invalid codes parameter`,
                502: `Upstream service error`,
            },
        });
    }
}
