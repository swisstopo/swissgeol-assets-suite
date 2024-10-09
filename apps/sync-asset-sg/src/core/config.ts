export type Mode = 'view' | 'extern';

export interface SyncConfig {
  mode: Mode;
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
    source: {
      connectionString: getEnvOrThrow('SOURCE_CONNECTION_STRING'),
      allowedWorkgroupIds: process.env['SOURCE_WORKGROUP_IDS']?.split(',').map(Number) ?? [],
    },
    destination: {
      connectionString: getEnvOrThrow('DESTINATION_CONNECTION_STRING'),
      allowedWorkgroupIds: process.env['DESTINATION_WORKGROUP_IDS']?.split(',').map(Number),
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
