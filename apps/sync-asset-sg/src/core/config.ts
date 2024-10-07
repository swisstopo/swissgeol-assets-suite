export interface SyncConfig {
  allowedWorkgroupIds: number[];
  source: {
    connectionString: string;
  };
  destination: {
    connectionString: string;
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
    allowedWorkgroupIds: getEnvOrThrow('ALLOWED_WORKGROUP_IDS').split(',').map(Number),
    source: {
      connectionString: getEnvOrThrow('SOURCE_CONNECTION_STRING'),
    },
    destination: {
      connectionString: getEnvOrThrow('DESTINATION_CONNECTION_STRING'),
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
