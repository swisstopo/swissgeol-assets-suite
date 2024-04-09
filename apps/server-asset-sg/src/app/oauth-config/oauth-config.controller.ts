import { Controller, Get } from '@nestjs/common';

@Controller('oauth-config')
export class OAuthController {
    @Get('config')
    getConfig() {
        return {
            oauth_issuer: process.env.OAUTH_ISSUER,
            oauth_clientId: process.env.OAUTH_CLIENT_ID,
            oauth_scope: process.env.OAUTH_SCOPE,
            oauth_responseType: process.env.OAUTH_RESPONSE_TYPE,
            oauth_showDebugInformation: !!process.env.OAUTH_SHOW_DEBUG_INFORMATION,
            oauth_tokenEndpoint: process.env.OAUTH_TOKEN_ENDPOINT,
        };
    }
}
