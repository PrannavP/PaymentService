import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { PaymentService } from './payment.service';
import { KhaltiProvider } from './providers/khalti.provider';
import {
    PaymentProvider,
    PaymentStatus,
} from './interface/payment-provider.interface';

describe('PaymentService', () => {
    let service: PaymentService;

    // mock KhaltiProvider so unit tests do not make real HTTP calls
    const mockKhaltiProvider = {
        method: PaymentProvider.KHALTI,
        initiatePayment: vi.fn(),
        verifyPayment: vi.fn(),
    };

    beforeEach(async () => {
        // reset mock call history before each test
        vi.clearAllMocks();

        // create testing module with PaymentService and mocked KhaltiProvider
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                {
                    provide: KhaltiProvider,
                    useValue: mockKhaltiProvider,
                },
            ],
        }).compile();

        service = module.get<PaymentService>(PaymentService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should call KhaltiProvider and return normalized initiate result', async () => {
        // arrange a fake Khalti initiate response
        const expectedResult = {
            transactionId: 'tx-123',
            provider: PaymentProvider.KHALTI,
            providerRef: 'pidx-123',
            paymentUrl: 'https://test-pay.khalti.com/?pidx=pidx-123',
        };
        mockKhaltiProvider.initiatePayment.mockResolvedValue(expectedResult);

        // act
        const result = await service.initiatePayment(
            { amount: 1000, purchase_order_id: 'ORDER-1' },
            PaymentProvider.KHALTI,
        );

        // assert provider was called with payload and a generated UUID
        expect(mockKhaltiProvider.initiatePayment).toHaveBeenCalledWith(
            { amount: 1000, purchase_order_id: 'ORDER-1' },
            expect.any(String),
        );
        expect(result).toEqual(expectedResult);
    });

    it('should call KhaltiProvider and return normalized verify result', async () => {
        // arrange a fake Khalti verify response
        const expectedResult = {
            provider: PaymentProvider.KHALTI,
            providerRef: 'pidx-123',
            transactionId: 'khalti-tx-1',
            status: PaymentStatus.COMPLETED,
            amount: 1000,
            fee: 0,
            refunded: false,
        };
        mockKhaltiProvider.verifyPayment.mockResolvedValue(expectedResult);

        // act
        const result = await service.verifyPayment(
            'pidx-123',
            PaymentProvider.KHALTI,
        );

        // assert provider lookup was called with the paymentId
        expect(mockKhaltiProvider.verifyPayment).toHaveBeenCalledWith(
            'pidx-123',
        );
        expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException for an invalid payment method', async () => {
        await expect(
            service.initiatePayment({ amount: 1000 }, 'unknown_gateway'),
        ).rejects.toThrow(BadRequestException);

        await expect(
            service.verifyPayment('pidx-123', 'unknown_gateway'),
        ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for an unimplemented provider', async () => {
        await expect(
            service.initiatePayment({ amount: 1000 }, PaymentProvider.ESEWA),
        ).rejects.toThrow(BadRequestException);

        await expect(
            service.verifyPayment('pidx-123', PaymentProvider.ESEWA),
        ).rejects.toThrow(BadRequestException);
    });
});
