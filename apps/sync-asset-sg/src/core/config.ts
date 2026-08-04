export type Mode = 'view' | 'extern';

/**
 * Number of full file rows (including their large JSON columns) fetched, transformed and inserted per iteration while
 * exporting files. A single conservative value bounds the file-export memory peak to at most this many file rows at a
 * time, independent of the asset batch size. Each chunk is inserted and released before the next chunk is fetched.
 */
export const FILE_CHUNK_SIZE = 100;

export interface SyncConfig {
  mode: Mode;
  syncAssignee: string | undefined;
  source: {
    connectionString: string;
    allowedWorkgroupIds: number[];
  };
  destination: {
    connectionString: string;
    allowedWorkgroupIds: number[];
  };
}

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function getConfig(): SyncConfig {
  return {
    mode: getEnvOrThrow('MODE') as Mode,
    syncAssignee: process.env['SYNC_ASSIGNEE'],
    source: {
      connectionString: getEnvOrThrow('SOURCE_CONNECTION_STRING'),
      allowedWorkgroupIds: process.env['SOURCE_WORKGROUP_IDS']?.split(',').map(Number) ?? [],
    },
    destination: {
      connectionString: getEnvOrThrow('DESTINATION_CONNECTION_STRING'),
      allowedWorkgroupIds: process.env['DESTINATION_WORKGROUP_IDS']?.split(',').map(Number) ?? [],
    },
  };
}

export function prismaConfig(connectionString: string) {
  return {
    datasources: {
      db: {
        url: connectionString,
      },
    },
  };
}

export function maskSecrets(config: SyncConfig): SyncConfig {
  return {
    ...config,
    source: {
      ...config.source,
      connectionString: '****' + config.source.connectionString.split('@').pop(),
    },
    destination: {
      ...config.destination,
      connectionString: '***' + config.destination.connectionString.split('@').pop(),
    },
  };
}
