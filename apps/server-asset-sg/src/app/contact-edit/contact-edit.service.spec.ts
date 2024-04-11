import { Test, TestingModule } from '@nestjs/testing';
import { left, right } from 'fp-ts/Either';

import { Contact, PatchContact } from '@asset-sg/shared';

import { PrismaService } from '../prisma/prisma.service';

import { ContactEditService } from './contact-edit.service';


jest.mock('../prisma/prisma.service');

const mockPatchContact: PatchContact = {
    name: 'John Doe',
    street: '123 Main Street',
    houseNumber: '1A',
    plz: '12345',
    locality: 'City',
    country: 'Country',
    telephone: '123-456-7890',
    email: 'john.doe@example.com',
    website: 'www.example.com',
    contactKindItemCode: '123'
};
const mockContact: Contact = {
    id: 1,
    contactKindItemCode: '123',
    name: 'John Doe',
    street: '123 Main Street',
    houseNumber: '1A',
    plz: '12345',
    locality: 'City',
    country: 'Country',
    telephone: '123-456-7890',
    email: 'john.doe@example.com',
    website: 'www.example.com'
};

const mockPrisma = {
    contact: {}
};


describe('ContactEditService', () => {
    let service: ContactEditService;
    let prismaService: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContactEditService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();

        service = module.get<ContactEditService>(ContactEditService);
        prismaService = module.get<PrismaService>(PrismaService);

    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a contact', async () => {
        prismaService.contact.create = jest.fn().mockResolvedValue(mockContact);

        const result = await service.createContact(mockPatchContact)();

        expect(result).toEqual(right(mockContact));
        expect(prismaService.contact.create).toHaveBeenCalledWith({ data: mockPatchContact });
    });

    it('should update a contact', async () => {
        const mockContactId = 1;

        prismaService.contact.update = jest.fn().mockResolvedValue(mockPatchContact);
        prismaService.contact.findFirstOrThrow = jest.fn().mockResolvedValue(mockContact);

        const result = await service.updateContact(mockContactId, mockContact)();

        expect(result).toEqual(right(mockContact));
        expect(prismaService.contact.update).toHaveBeenCalledWith({ where: { contactId: mockContactId }, data: mockContact });
    });

    it('should handle errors when creating a contact', async () => {
        prismaService.contact.create = jest.fn().mockRejectedValue(new Error('Test error'));

        const result = await service.createContact(mockContact)();

        expect(result).toEqual(left(new Error()));
        expect(prismaService.contact.create).toHaveBeenCalledWith({ data: mockContact });
    });

    it('should handle errors when updating a contact', async () => {
        const mockContactId = 1;
        prismaService.contact.update = jest.fn().mockRejectedValue(new Error('Test error'));

        const result = await service.updateContact(mockContactId, mockContact)();

        expect(result).toEqual(left(new Error()));
        expect(prismaService.contact.update).toHaveBeenCalledWith({ where: { contactId: mockContactId }, data: mockContact });
    });
});