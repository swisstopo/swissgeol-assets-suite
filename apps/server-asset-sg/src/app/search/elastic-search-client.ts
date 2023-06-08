import { ClientOptions, Client as ElasticSearchClient } from '@elastic/elasticsearch';

export const createElasticSearchClient = () => {
    const options: ClientOptions = {
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        ...(process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
            ? {
                  auth: {
                      username: process.env.ELASTICSEARCH_USERNAME || '',
                      password: process.env.ELASTICSEARCH_PASSWORD || '',
                  },
              }
            : {}),
    };

    return new ElasticSearchClient(options);
};
