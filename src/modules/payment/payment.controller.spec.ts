import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentProvider } from './interface/payment-provider.interface';

describe('PaymentController', () => {
    let controller: PaymentController;

    // mock PaymentService so controller tests stay isolated
    const mockPaymentService = {
        initiatePayment: vi.fn(),
    };

    beforeEach(async () => {
        // reset mock calls before each test
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [PaymentController],
            providers: [
                {
                    provide: PaymentService,
                    useValue: mockPaymentService,
                },
            ],
        }).compile();

        controller = module.get<PaymentController>(PaymentController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should forward initiatePayment request to PaymentService', async () => {
        const expected = {
            transactionId: 'tx-123',
            provider: PaymentProvider.KHALTI,
            providerRef: 'pidx-123',
            paymentUrl: 'https://test-pay.khalti.com/?pidx=pidx-123',
        };
        mockPaymentService.initiatePayment.mockResolvedValue(expected);

        const result = await controller.initiatePayment({
            payload: { amount: 500 },
            paymentMethod: PaymentProvider.KHALTI,
        });

        expect(mockPaymentService.initiatePayment).toHaveBeenCalledWith(
            { amount: 500 },
            PaymentProvider.KHALTI,
        );
        expect(result).toEqual(expected);
    });
});
