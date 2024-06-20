import { Client } from '@elastic/elasticsearch';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';

export const openElasticsearchClient = () =>
  new Client({
    node: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME ?? '',
      password: process.env.ELASTICSEARCH_PASSWORD ?? '',
    },
  });

export const provideElasticsearch: FactoryProvider<Client> = {
  provide: Client,
  useFactory: openElasticsearchClient,
};
