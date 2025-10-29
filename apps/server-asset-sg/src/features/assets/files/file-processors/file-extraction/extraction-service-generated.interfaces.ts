/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/**
 * CollectPayload
 * Payload model for retrieving results of a processed document.
 * @example {"file":"10122_1.pdf"}
 */
export interface CollectPayload {
  /**
   * File
   * @minLength 1
   */
  file: string;
}

/**
 * CollectResponse
 * Response model for the collect request endpoint containing processing status and results.
 * @example {"data":[{"filename":"input.pdf","metadata":{"languages":["fr"],"page_count":1},"pages":[{"page_metadata":{"is_frontpage":true,"language":"fr"},"page_number":1,"predicted_class":"Map"}]}],"has_finished":true}
 */
export interface CollectResponse {
  /** Has Finished */
  has_finished: boolean;
  /** Data */
  data: PredictionSchema[] | null;
}

/**
 * ErrorResponse
 * Error response model.
 */
export interface ErrorResponse {
  /** Detail */
  detail: string;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/**
 * MetaDataSchema
 * Schema for document-level metadata including page count and languages.
 */
export interface MetaDataSchema {
  /** Page Count */
  page_count: number;
  /** Languages */
  languages: string[];
}

/**
 * PageMetaDataSchema
 * Schema for page-level metadata including language and frontpage status.
 */
export interface PageMetaDataSchema {
  /** Language */
  language: string | null;
  /** Is Frontpage */
  is_frontpage: boolean;
}

/**
 * PagePrediction
 * Schema for individual page prediction results including class, number and metadata.
 */
export interface PagePrediction {
  /** Predicted Class */
  predicted_class: string;
  /**
   * Page Number
   * Page number must be greater than 0
   * @exclusiveMin 0
   */
  page_number: number;
  /** Schema for page-level metadata including language and frontpage status. */
  page_metadata: PageMetaDataSchema;
}

/**
 * PredictionSchema
 * Schema for the complete document prediction results including metadata and page predictions.
 */
export interface PredictionSchema {
  /** Filename */
  filename: string;
  /** Schema for document-level metadata including page count and languages. */
  metadata: MetaDataSchema;
  /** Pages */
  pages: PagePrediction[];
}

/**
 * StartPayload
 * Payload model for initiating a new document processing task.
 * @example {"file":"10122_1.pdf"}
 */
export interface StartPayload {
  /**
   * File
   * @minLength 5
   */
  file: string;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}
