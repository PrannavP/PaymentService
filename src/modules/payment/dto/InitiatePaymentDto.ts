import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
    @ApiProperty({
        description: 'Payment payload',
        type: Object,
        example: {
            amount: 1000,
            currency: 'NPR',
        },
    })
    payload: any;

    @ApiProperty({
        description: 'Payment method',
        example: 'esewa',
    })
    paymentMethod: string;
};