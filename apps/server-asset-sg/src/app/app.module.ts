import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssetEditController } from './asset-edit/asset-edit.controller';
import { AssetEditService } from './asset-edit/asset-edit.service';
import { ContactEditController } from './contact-edit/contact-edit.controller';
import { ContactEditService } from './contact-edit/contact-edit.service';
import { JwtMiddleware } from './jwt/jwt-middleware';
import { OAuthController } from './oauth-config/oauth-config.controller';
import { OcrController } from './ocr/ocr.controller';
import { PrismaService } from './prisma/prisma.service';
import { AssetRepo } from './repos/asset.repo';
import { AssetSearchService } from './search/asset-search-service';
import { provideElasticsearch } from './search/elasticsearch';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';

@Module({
    imports: [HttpModule, ScheduleModule.forRoot(), CacheModule.register()],
    controllers: [
        AppController,
        AdminController,
        UserController,
        AssetEditController,
        ContactEditController,
        OcrController,
        OAuthController,
    ],
    providers: [
        provideElasticsearch,
        AppService,
        AdminService,
        PrismaService,
        UserService,
        AssetEditService,
        ContactEditService,
        AssetRepo,
        AssetSearchService,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(JwtMiddleware).exclude('api/oauth-config/config', 'api/ocr/(.*)').forRoutes('*');
    }
}
