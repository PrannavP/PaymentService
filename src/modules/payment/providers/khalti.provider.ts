import { Injectable } from '@nestjs/common';
import {
    InitiatePaymentPayload,
    PaymentProvider,
    PaymentProviderInterface,
} from '../interface/payment-provider.interface';

// making the class injectable so that it can be injected into other classes
@Injectable()
export class KhaltiProvider implements PaymentProviderInterface {
    readonly method = PaymentProvider.KHALTI;

    async initiatePayment(payload: InitiatePaymentPayload): Promise<any> {
        // call the khalti api to initiate the payment and return the response

        // store the khalti url in a variable and use it to make the api call
        let khaltiUrl =
            process.env.IS_PRODUCTION === 'true'
                ? process.env.KHALTI_PAYMENT_PROD_URL
                : process.env.KHALTI_PAYMENT_DEV_URL;
        khaltiUrl = khaltiUrl + 'epayment/initiate/';

        // if no khalti url is configured, throw an error
        // TODO: later change this error to custom error class
        if (!khaltiUrl) {
            throw new Error('Khalti payment URL is not configured');
        }

        // format the payload to match the khalti api requirements
        const formattedPayload = {
            amount: parseFloat(payload.amount.toFixed(2)) * 100, // khalti api requires the amount in paisa, so multiply by 100
            success_url: payload.success_url,
            failure_url: payload.failure_url,
            return_url: 'http://localhost:5173/payment/khalti/verify', // TODO: later change this to the actual return url
            website_url: 'http://localhost:5173/', // TODO: later change this to the actual website url
            purchase_order_id: payload.purchase_order_id,
            purchase_order_name: payload.purchase_order_name,
        };

        const response = await fetch(khaltiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Key ' + process.env.KHALTI_LIVE_SECRET_KEY,
            },
            body: JSON.stringify(formattedPayload),
        });

        // store the response in a variable and return it
        const responseData = await response.json();
        console.log(responseData);

        // send the response data to the frontend to redirect the user to the khalti payment page
        // You can use the response data to construct the redirect URL
        // For example, you can use the `payment_url` from the response to redirect the user

        const redirectUrl = responseData.payment_url;

        // the success response of khalti looks like this:
        // {
        //     "pidx": "bZQLD9wRVWo4CdESSfuSsB",
        //     "payment_url": "https://test-pay.khalti.com/?pidx=bZQLD9wRVWo4CdESSfuSsB",
        //     "expires_at": "2023-05-25T16:26:16.471649+05:45",
        //     "expires_in": 1800
        // }


        return responseData;

        // return await response.json();
    }

    async verifyPayment(paymentId: string): Promise<any> {
        // Implement the logic to verify a payment with Khalti
        // You can use Khalti's API to verify the payment status
        // Return the response from Khalti's API
    }

    async refundPayment(paymentId: string, amount: number): Promise<any> {
        // Implement the logic to refund a payment with Khalti
        // You can use Khalti's API to initiate a refund request
        // Return the response from Khalti's API
    }
}
