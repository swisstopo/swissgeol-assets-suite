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
 * PageClasses
 * Enum for classifying pages into page types.
 */
export enum PageClasses {
  Boreprofile = 'boreprofile',
  Diagram = 'diagram',
  GeoProfile = 'geo_profile',
  Map = 'map',
  SectionHeader = 'section_header',
  Table = 'table',
  Text = 'text',
  TitlePage = 'title_page',
  Unknown = 'unknown',
}

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
 * @example {"data":{"entities":[{"classification":"boreprofile","language":"de","page_end":3,"page_start":1,"title":"BS1"}],"filename":"input.pdf","languages":["de"],"page_count":3},"has_finished":true}
 */
export interface CollectResponse {
  /** Has Finished */
  has_finished: boolean;
  data: ProcessorDocumentEntities | null;
}

/**
 * ErrorResponse
 * Error response model.
 */
export interface ErrorResponse {
  /** Detail */
  detail: string;
}

/**
 * ProcessedEntities
 * Processed page entities from PDF.
 */
export interface ProcessedEntities {
  /** Enum for classifying pages into page types. */
  classification: PageClasses;
  /** Language */
  language: string | null;
  /** Page Start */
  page_start: number;
  /** Page End */
  page_end: number;
  /** Title */
  title?: string | null;
}

/**
 * ProcessorDocumentEntities
 * Restructured document as entities.
 * @example {"entities":[{"classification":"boreprofile","language":"de","page_end":3,"page_start":1,"title":"BS1"},{"classification":"map","language":"fr","page_end":4,"page_start":4}],"filename":"input.pdf","languages":["de"],"page_count":3}
 */
export interface ProcessorDocumentEntities {
  /** Filename */
  filename: string;
  /** Page Count */
  page_count: number;
  /** Languages */
  languages: string[];
  /** Entities */
  entities: ProcessedEntities[];
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
