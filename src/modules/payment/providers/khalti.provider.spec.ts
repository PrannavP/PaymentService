import {
    BadGatewayException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KhaltiProvider } from './khalti.provider';
import {
    PaymentProvider,
    PaymentStatus,
} from '../interface/payment-provider.interface';

describe('KhaltiProvider', () => {
    let provider: KhaltiProvider;

    // mock ConfigService with sandbox Khalti values
    const configValues: Record<string, string> = {
        IS_PRODUCTION: 'false',
        KHALTI_PAYMENT_DEV_URL: 'https://dev.khalti.com/api/v2/',
        KHALTI_PAYMENT_PROD_URL: 'https://khalti.com/api/v2/',
        KHALTI_LIVE_SECRET_KEY: 'test_secret_key',
    };

    const mockConfigService = {
        get: vi.fn((key: string) => configValues[key]),
        getOrThrow: vi.fn((key: string) => configValues[key]),
    } as unknown as ConfigService;

    beforeEach(() => {
        vi.clearAllMocks();
        provider = new KhaltiProvider(mockConfigService);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('initiatePayment', () => {
        it('should send amount in paisa and return normalized InitiatePaymentResult', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    pidx: 'bZQLD9wRVWo4CdESSfuSsB',
                    payment_url:
                        'https://test-pay.khalti.com/?pidx=bZQLD9wRVWo4CdESSfuSsB',
                    expires_at: '2023-05-25T16:26:16.471649+05:45',
                    expires_in: 1800,
                }),
            });
            vi.stubGlobal('fetch', fetchMock);

            const result = await provider.initiatePayment(
                {
                    amount: 13.5,
                    return_url: 'https://example.com/payment/',
                    website_url: 'https://example.com/',
                    purchase_order_id: 'ORDER-12',
                    purchase_order_name: 'Pro Plan',
                    customer_name: 'Khalti Bahadur',
                    customer_email: 'example@gmail.com',
                    customer_phone: '9800000123',
                },
                'tx-uuid-1',
            );

            // verify endpoint, Authorization header, and paisa body
            expect(fetchMock).toHaveBeenCalledWith(
                'https://dev.khalti.com/api/v2/epayment/initiate/',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Key test_secret_key',
                    },
                }),
            );

            const sentBody = JSON.parse(
                (fetchMock.mock.calls[0][1] as RequestInit).body as string,
            );
            expect(sentBody).toEqual({
                amount: 1350,
                return_url: 'https://example.com/payment/',
                website_url: 'https://example.com/',
                purchase_order_id: 'ORDER-12',
                purchase_order_name: 'Pro Plan',
                customer_info: {
                    name: 'Khalti Bahadur',
                    email: 'example@gmail.com',
                    phone: '9800000123',
                },
            });

            expect(result).toEqual({
                transactionId: 'tx-uuid-1',
                provider: PaymentProvider.KHALTI,
                providerRef: 'bZQLD9wRVWo4CdESSfuSsB',
                paymentUrl:
                    'https://test-pay.khalti.com/?pidx=bZQLD9wRVWo4CdESSfuSsB',
                expiresAt: '2023-05-25T16:26:16.471649+05:45',
                rawResponse: expect.any(Object),
            });
        });

        it('should reject amounts below Rs. 10 (1000 paisa)', async () => {
            await expect(
                provider.initiatePayment({ amount: 9.99 }, 'tx-uuid-2'),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException when Khalti returns 400 validation_error', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: false,
                    status: 400,
                    json: vi.fn().mockResolvedValue({
                        return_url: ['Enter a valid URL.'],
                        error_key: 'validation_error',
                    }),
                }),
            );

            await expect(
                provider.initiatePayment(
                    { amount: 100, return_url: 'not-a-url' },
                    'tx-uuid-3',
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('verifyPayment', () => {
        it('should return COMPLETED when Khalti lookup returns 200 Completed', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: vi.fn().mockResolvedValue({
                        pidx: 'HT6o6PEZRWFJ5ygavzHWd5',
                        total_amount: 1000,
                        status: 'Completed',
                        transaction_id: 'GFq9PFS7b2iYvL8Lir9oXe',
                        fee: 0,
                        refunded: false,
                    }),
                }),
            );

            const result = await provider.verifyPayment(
                'HT6o6PEZRWFJ5ygavzHWd5',
            );

            expect(result).toEqual({
                provider: PaymentProvider.KHALTI,
                providerRef: 'HT6o6PEZRWFJ5ygavzHWd5',
                transactionId: 'GFq9PFS7b2iYvL8Lir9oXe',
                status: PaymentStatus.COMPLETED,
                amount: 10,
                fee: 0,
                refunded: false,
                rawResponse: expect.any(Object),
            });
        });

        it('should return EXPIRED when Khalti lookup returns HTTP 400 with Expired payload', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: false,
                    status: 400,
                    json: vi.fn().mockResolvedValue({
                        pidx: 'H889Er9gq4j92oCrePrDwf',
                        total_amount: 1000,
                        status: 'Expired',
                        transaction_id: null,
                        fee: 0,
                        refunded: false,
                    }),
                }),
            );

            const result = await provider.verifyPayment(
                'H889Er9gq4j92oCrePrDwf',
            );

            expect(result.status).toBe(PaymentStatus.EXPIRED);
            expect(result.transactionId).toBeNull();
        });

        it('should return CANCELED when Khalti lookup returns HTTP 400 with User canceled payload', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: false,
                    status: 400,
                    json: vi.fn().mockResolvedValue({
                        pidx: 'vNTeXkSEaEXK2J4i7cQU6e',
                        total_amount: 1000,
                        status: 'User canceled',
                        transaction_id: null,
                        fee: 0,
                        refunded: false,
                    }),
                }),
            );

            const result = await provider.verifyPayment(
                'vNTeXkSEaEXK2J4i7cQU6e',
            );

            expect(result.status).toBe(PaymentStatus.CANCELED);
            expect(result.transactionId).toBeNull();
        });

        it('should map Partially Refunded case-insensitively to REFUNDED', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: vi.fn().mockResolvedValue({
                        pidx: 'HT6o6PEZRWFJ5ygavzHWd5',
                        total_amount: 1000,
                        status: 'Partially Refunded',
                        transaction_id: 'GFq9PFS7b2iYvL8Lir9oXe',
                        fee: 0,
                        refunded: true,
                    }),
                }),
            );

            const result = await provider.verifyPayment(
                'HT6o6PEZRWFJ5ygavzHWd5',
            );

            expect(result.status).toBe(PaymentStatus.REFUNDED);
        });

        it('should throw NotFoundException when pidx is not found', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: false,
                    status: 404,
                    json: vi.fn().mockResolvedValue({
                        detail: 'Not found.',
                        error_key: 'validation_error',
                    }),
                }),
            );

            await expect(
                provider.verifyPayment('invalid-pidx'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadGatewayException on 401 Invalid token', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue({
                    ok: false,
                    status: 401,
                    json: vi.fn().mockResolvedValue({
                        detail: 'Invalid token.',
                        status_code: 401,
                    }),
                }),
            );

            await expect(
                provider.verifyPayment('HT6o6PEZRWFJ5ygavzHWd5'),
            ).rejects.toThrow(BadGatewayException);
        });

        it('should throw BadRequestException when paymentId is blank', async () => {
            await expect(provider.verifyPayment('   ')).rejects.toThrow(
                BadRequestException,
            );
        });
    });
});
