/**
 * Bruno Collection Type Definitions
 */

export interface BrunoEnvironment {
  name: string;
  variables: Record<string, string>;
  secrets: string[];
}

export interface BrunoRequest {
  name: string;
  type: 'http';
  seq: number;
  method: HttpMethod;
  url: string;
  body?: {
    mode: 'json' | 'form' | 'raw' | 'none';
    json?: any;
    form?: Record<string, string>;
    raw?: string;
  };
  auth?: {
    type: 'bearer' | 'basic' | 'none';
    bearer?: string;
    basic?: {
      username: string;
      password: string;
    };
  };
  headers?: Record<string, string>;
  tests?: string;
  docs?: string;
}

export interface BrunoCollection {
  version: string;
  name: string;
  type: 'collection';
  ignore: string[];
}

export interface BrunoFolder {
  name: string;
  requests: BrunoRequest[];
}

export interface ApiRoute {
  path: string;
  method: HttpMethod;
  handler: string;
  middleware?: string[];
  description?: string;
}

export interface CollectionConfig {
  name: string;
  version: string;
  baseUrl: string;
  environments: string[];
  folders: string[];
}

export interface EnvironmentConfig {
  name: string;
  variables: Record<string, string>;
  secrets: string[];
}

export interface BrunoCliOptions {
  collection?: string;
  environment?: string;
  folder?: string;
  recursive?: boolean;
  reporter?: 'cli' | 'json' | 'junit' | 'html';
  output?: string;
  insecure?: boolean;
  cacert?: string;
  env?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface RequestTemplate {
  name: string;
  method: HttpMethod;
  path: string;
  description?: string;
  auth?: boolean;
  pathParams?: string[];
  queryParams?: string[];
  bodySchema?: any;
  responseSchema?: any;
}

export interface FolderStructure {
  [folderName: string]: string[] | {
    requests: RequestTemplate[];
  };
}