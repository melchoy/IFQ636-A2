import { PaymentValidationError } from "./payment.errors.js";
import { env } from "../../config/env.js";
import { Client, Environment, OrdersController, CheckoutPaymentIntent, PaypalExperienceUserAction } from '@paypal/paypal-server-sdk';
import { PaymentProvider, CheckoutSessionInput, VerifySessionInput } from "./payment.interface.service.js";

const paypalKey = env.paypalSecretKey;
const paypalClientId = env.paypalClientId;

function createPayPalClient() {
    return new Client({
        clientCredentialsAuthCredentials: {
            oAuthClientId: paypalClientId,
            oAuthClientSecret: paypalKey
        },
        environment: Environment.Sandbox,
    });
}



export class PayPalPaymentAdapter implements PaymentProvider {

    private getOrdersController() {
        return new OrdersController(createPayPalClient());
    }

    async createCheckoutSession(input: CheckoutSessionInput) {
        try {
    const total = input.items
    .reduce((sum, item) => sum + item.lineTotal, 0)
    .toFixed(2);
    const data = {
        body: { 
            intent: CheckoutPaymentIntent.Capture,
            purchaseUnits: [
                {
                    amount: {
                        currencyCode: 'AUD',
                        value: total,
                    },
                    customId: input.orderId,
                }
            ],
            paymentSource: {
                paypal: {
                    experienceContext: {
                        brandName: "Order of the Black Thorn",
                        returnUrl: input.successUrl,
                        cancelUrl: input.cancelUrl,
                        userAction: PaypalExperienceUserAction.PayNow,
                    }
                }
            }
        }
    };

    const ordersController = this.getOrdersController();
    const response = await ordersController.createOrder(data);
    const order = response.result;
    
    //fs.writeFileSync('paypal_checkout_sessions.log', `PayPal response------: ${JSON.stringify(order)}\n`, { flag: 'a' });
    const approveLink = order.links?.find((link) => link.rel === "approve" || link.rel === "payer-action");
    if (!approveLink?.href || !order.id) {
        throw new PaymentValidationError(
        "Unable to create PayPal checkout session",
        );
    }

    const session = {
      id: order.id,
      url: approveLink.href,
    };

    if (!session.url || !session.id) {
      throw new PaymentValidationError("Unable to create checkout session");
    }

    
    return { sessionId: session.id, redirectUrl: session.url };
    }
    catch (error) {        
        throw new PaymentValidationError("Unable to create PayPal checkout session");
    }
  }

  async verifyCheckoutSession(input: VerifySessionInput) {
    

    const ordersController = this.getOrdersController();
    const response = await ordersController.captureOrder({
        id: input.sessionId,
    });
    const order = response.result;

    
    if (order.status !== "COMPLETED") {
        throw new PaymentValidationError("Payment could not be verified");
    }

    const capture = order.purchaseUnits?.[0]?.payments?.captures?.[0];

    if (!capture) {
    throw new PaymentValidationError("PayPal capture details missing");
    }

    const capturedAmount = parseFloat(capture.amount?.value ?? "0");
    const expectedAmount = parseFloat(input.expectedTotal.toFixed(2));

    if (
    capturedAmount !== expectedAmount ||
    capture.amount?.currencyCode?.toLowerCase() !== "aud"
    ) {
    throw new PaymentValidationError("PayPal payment amount mismatch");
    }

    if (capture.customId !== input.orderId) {
        throw new PaymentValidationError("PayPal order ID mismatch");
    }

    return {
        amount: capturedAmount,
        currency: "aud",
        paymentReference: capture.id!, 
        providerSessionId: order.id!,
    };
  }
}
