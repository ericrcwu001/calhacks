/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Product = {
    /**
     * Product barcode
     */
    code?: string;
    /**
     * Product name in English
     */
    product_name_en?: string;
    /**
     * Generic product name in English
     */
    generic_name_en?: string;
    /**
     * Product quantity with unit
     */
    quantity?: string;
    /**
     * Numeric product quantity
     */
    product_quantity?: number;
    /**
     * Unit of measurement
     */
    product_quantity_unit?: string;
    /**
     * Serving size with unit
     */
    serving_size?: string;
    /**
     * Numeric serving quantity
     */
    serving_quantity?: number;
    /**
     * Serving unit of measurement
     */
    serving_quantity_unit?: string;
    /**
     * Detailed ingredients list with analysis
     */
    ingredients?: Array<{
        /**
         * Ingredient ID
         */
        id?: string;
        /**
         * Ingredient name
         */
        text?: string;
        /**
         * Estimated percentage
         */
        percent_estimate?: number;
        /**
         * Vegan status
         */
        vegan?: string;
        /**
         * Vegetarian status
         */
        vegetarian?: string;
    }>;
    /**
     * Ingredients text in English
     */
    ingredients_text_en?: string;
    /**
     * Analysis tags for ingredients
     */
    ingredients_analysis_tags?: Array<string>;
    /**
     * Allergen information
     */
    allergens_tags?: Array<string>;
    /**
     * URL of the main product image
     */
    image_url?: string | null;
    /**
     * Data source
     */
    source?: string;
};

