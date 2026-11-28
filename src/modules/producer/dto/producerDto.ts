import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProducerDto {
    @ApiProperty({
        description: 'Amount of the transaction',
        example: 1000,
        type: Number,
    })
    amount: number;

    @ApiPropertyOptional({
        description: 'URL to redirect after successful payment',
        example: 'https://example.com/success',
    })
    success_url?: string;

    @ApiPropertyOptional({
        description: 'URL to redirect after failed payment',
        example: 'https://example.com/failure',
    })
    failure_url?: string;

    @ApiPropertyOptional({
        description: 'URL to redirect after payment completion',
        example: 'https://example.com/return',
    })
    return_url?: string;

    @ApiPropertyOptional({
        description: 'Website URL of the producer',
        example: 'https://example.com',
    })
    website_url?: string;

    @ApiPropertyOptional({
        description: 'Unique purchase order ID',
        example: 'ORDER-12345',
    })
    purchase_order_id?: string;

    @ApiPropertyOptional({
        description: 'Name of the purchase order',
        example: 'Test Product',
    })
    purchase_order_name?: string;

    // customer details
    @ApiProperty({
        description: 'Customer name',
        example: 'John Doe',
    })
    customer_name: string;
    
    @ApiProperty({
        description: 'Customer email',
        example: 'john.doe@example.com',
    })
    customer_email: string;
}