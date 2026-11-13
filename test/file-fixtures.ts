import { LegalDocCode } from '@asset-sg/shared/v2';
import { PrismaClient } from '@prisma/client';

export const setupContractLegalDocItem = async (prisma: PrismaClient): Promise<void> => {
  await prisma.legalDocItem.upsert({
    where: { legalDocItemCode: LegalDocCode.Contract },
    update: {},
    create: {
      legalDocItemCode: LegalDocCode.Contract,
      geolCode: 'test',
      name: 'Contract',
      nameDe: 'Vertrag',
      nameFr: 'Contrat',
      nameIt: 'Contratto',
      nameEn: 'Contract',
      description: 'Contract',
      descriptionDe: 'Vertrag',
      descriptionFr: 'Contrat',
      descriptionIt: 'Contratto',
      descriptionEn: 'Contract',
    },
  });
};

export interface CreateTestFileOptions {
  name?: string;
  formatCode?: string;
  isFormatOverridden?: boolean;
  legalDocItemCode?: LegalDocCode | null;
  content?: boolean;
}

export const createTestFile = (prisma: PrismaClient, assetId: number, options: CreateTestFileOptions = {}) => {
  const {
    name = 'file.pdf',
    formatCode = 'pdf',
    isFormatOverridden = false,
    legalDocItemCode = null,
    content = false,
  } = options;
  return prisma.file.create({
    data: {
      name,
      size: 1,
      lastModifiedAt: new Date(),
      assetId,
      assetFormatItemCode: formatCode,
      isFormatOverridden,
      legalDocItemCode,
      type: legalDocItemCode === null ? 'Normal' : 'Legal',
      fulltextContent: content ? [{ page: 1, content: `Text of ${name}` }] : undefined,
    },
  });
};
