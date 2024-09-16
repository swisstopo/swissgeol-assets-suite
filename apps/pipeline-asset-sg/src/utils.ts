export const prismaConfig = (connectionString: string) => ({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});
