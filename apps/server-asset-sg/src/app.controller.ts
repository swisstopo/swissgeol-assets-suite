import { AppConfig, AppMode, User } from '@asset-sg/shared/v2';
import { Controller, Get } from '@nestjs/common';

import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { PrismaService } from '@/core/prisma.service';
import { readEnv, requireEnv } from '@/utils/requireEnv';

@Controller('/')
export class AppController {
  private readonly config: AppConfig;

  constructor(private readonly prismaService: PrismaService) {
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

  @Get('/reference-data')
  @Authorize.User()
  async getReferenceData(@CurrentUser() user: User) {
    return await getReferenceData(user, this.prismaService);
  }
}

const getReferenceData = async (user: User, prismaService: PrismaService) => {
  const createReferenceDataMapping = async <A, K extends keyof A>(
    prismaResult: () => Promise<A[]>,
    key: K,
    newKey: string,
  ) => {
    const result = await prismaResult();
    const mapped = result.map(({ [key]: _key, ...rest }) => [_key as string, { [newKey]: _key, ...rest }] as const);

    return Object.fromEntries(mapped);
  };

  const entries = await Promise.all([
    createReferenceDataMapping(() => prismaService.assetFormatItem.findMany(), 'assetFormatItemCode', 'code').then(
      (data) => ['assetFormatItems', data],
    ),
    createReferenceDataMapping(() => prismaService.assetKindItem.findMany(), 'assetKindItemCode', 'code').then(
      (data) => ['assetKindItems', data],
    ),
    createReferenceDataMapping(() => prismaService.contactKindItem.findMany(), 'contactKindItemCode', 'code').then(
      (data) => ['contactKindItems', data],
    ),
    createReferenceDataMapping(() => prismaService.languageItem.findMany(), 'languageItemCode', 'code').then((data) => [
      'languageItems',
      data,
    ]),
    createReferenceDataMapping(() => prismaService.legalDocItem.findMany(), 'legalDocItemCode', 'code').then((data) => [
      'legalDocItems',
      data,
    ]),
    createReferenceDataMapping(() => prismaService.manCatLabelItem.findMany(), 'manCatLabelItemCode', 'code').then(
      (data) => ['manCatLabelItems', data],
    ),
    createReferenceDataMapping(() => prismaService.natRelItem.findMany(), 'natRelItemCode', 'code').then((data) => [
      'natRelItems',
      data,
    ]),
    createReferenceDataMapping(
      () =>
        user.isAdmin
          ? prismaService.contact.findMany()
          : prismaService.contact.findMany({
              where: {
                assetContacts: {
                  some: { asset: { workgroupId: { in: [...user.roles.keys()] } } },
                },
              },
            }),
      'contactId',
      'id',
    ).then((data) => ['contacts', data]),
  ]);

  return Object.fromEntries(entries);
};
