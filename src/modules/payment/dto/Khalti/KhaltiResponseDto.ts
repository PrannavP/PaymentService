// payment statuses returned by Khalti epayment lookup API
export enum KhaltiPaymentStatus {
    INITIATED = 'Initiated',
    PENDING = 'Pending',
    COMPLETED = 'Completed',
    EXPIRED = 'Expired',
    REFUNDED = 'Refunded',
    PARTIALLY_REFUNDED = 'Partially refunded',
    USER_CANCELED = 'User canceled',
}

// response shape returned by Khalti /epayment/initiate/ endpoint
export interface KhaltiInitiateResponseDto {
    pidx: string;
    payment_url: string;
    expires_at?: string;
    expires_in?: number;
}

// response shape returned by Khalti /epayment/lookup/ endpoint
export interface KhaltiResponseDto {
    pidx: string;
    total_amount: number;
    status: KhaltiPaymentStatus;
    transaction_id: string | null;
    fee: number;
    refunded: boolean;
}

// error response shape returned by Khalti on 4xx/5xx failures
export interface KhaltiErrorResponseDto {
    detail?: string;
    error_key?: string;
    status_code?: number;
}
