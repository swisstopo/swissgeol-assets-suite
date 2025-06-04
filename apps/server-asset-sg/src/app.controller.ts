import { AppConfig, AppMode } from '@asset-sg/shared/v2';
import { Controller, Get } from '@nestjs/common';

import { readEnv, requireEnv } from '@/utils/requireEnv';

@Controller('/')
export class AppController {
  private readonly config: AppConfig;

  constructor() {
    this.config = {
      mode: readEnv('ANONYMOUS_MODE', Boolean) ? AppMode.Anonymous : AppMode.Default,
      googleAnalyticsId: readEnv('GOOGLE_ANALYTICS_ID'),
      oauth: {
        issuer: requireEnv('OAUTH_ISSUER'),
        clientId: requireEnv('OAUTH_CLIENT_ID'),
        scope: requireEnv('OAUTH_SCOPE'),
        showDebugInformation: readEnv('OAUTH_SHOW_DEBUG_INFORMATION', Boolean) ?? false,
        tokenEndpoint: requireEnv('OAUTH_TOKEN_ENDPOINT'),
      },
    };
  }

  @Get('/config')
  showConfig(): AppConfig {
    return this.config;
  }
}
