import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { environment as env } from '@nst-caballus/env';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private _stripe: Stripe = new Stripe(env.stripe.secretKey, {
        apiVersion: '2022-11-15'
    });

    /**
     * createCustomer
     * It creates customer in stipe using the given details
     * @param details
     */
    public async createCustomer(details: {
        name: string;
        email: string;
        paymentMethod: string;
    }): Promise<string> {
        try {
            // create customer in stripe
            const customer = await this._stripe.customers.create({
                name: details.name,
                email: details.email,
                payment_method: details.paymentMethod
            });
            return customer.id;
        } catch (e) {
            throw new InternalServerErrorException(
                `Stripe: Customer create failed: ${e.raw.message}`
            );
        }
    }

    /**
     * getCustomer
     * fetches the customer details from the stripe using the customer id
     * @param customerId
     */
    public async getCustomer(
        customerId: string
    ): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
        return this._stripe.customers.retrieve(customerId);
    }

    /**
     * getPaymentMethods
     * @param customerId
     */
    public async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
        try {
            // get stripe payments method for the given customer
            const res = await this._stripe.paymentMethods.list({
                customer: customerId,
                type: 'card'
            });
            return res.data;
        } catch (e) {
            console.log(e);
            if (!!e.raw && e.raw.message) {
                throw new InternalServerErrorException(
                    `Stripe: Error getting invoice: ${e.raw.message}`
                );
            } else {
                throw new InternalServerErrorException('Unknown error: StripeService.getInvoice');
            }
        }
    }

    /**
     * subscribe
     * It subscribe to the plan
     * @param customerId
     * @param paymentMethodId
     * @param userId
     */
    public async subscribe(
        customerId: string,
        paymentMethodId: string,
        userId: string,
        couponCode: string
    ): Promise<Stripe.Subscription> {
        try {
            // create subscription on stripe
            return await this._stripe.subscriptions.create({
                customer: customerId,
                default_payment_method: paymentMethodId,
                items: [
                    {
                        price: env.stripe.priceKey,
                        metadata: {
                            userId
                        }
                    }
                ],
                coupon: couponCode
            });
        } catch (e) {
            throw new InternalServerErrorException(e.raw.message);
        }
    }

    /**
     * getSubscriptionDetails
     * fetches the subscription details from the stripe using the subscription id
     * @param subscriptionId
     */
    public async getSubscriptionDetails(subscriptionId: string): Promise<Stripe.Subscription> {
        try {
            return this._stripe.subscriptions.retrieve(subscriptionId);
        } catch (e) {
            throw new InternalServerErrorException(e.raw.message);
        }
    }

    /**
     * addItemToTheSubscription
     * adds a new item to the subscription items array
     * @param subscriptionId
     * @param userId
     */
    public async addItemToTheSubscription(
        subscriptionId: string,
        userId: string
    ): Promise<Stripe.Response<Stripe.SubscriptionItem>> {
        try {
            // create subscription item
            return await this._stripe.subscriptionItems.update(subscriptionId, {
                metadata: {
                    userId
                }
            });
        } catch (e) {
            throw new InternalServerErrorException(e.raw.message);
        }
    }

    /**
     * addItemToTheSubscription
     * adds a new item to the subscription items array
     * @param subscriptionItemId
     * @param params
     */
    public async updateSubscriptionItem(
        subscriptionItemId: string,
        params: Stripe.SubscriptionItemUpdateParams
    ): Promise<Stripe.Response<Stripe.SubscriptionItem>> {
        try {
            // create subscription item
            return await this._stripe.subscriptionItems.update(subscriptionItemId, params);
        } catch (e) {
            throw new InternalServerErrorException(e.raw.message);
        }
    }

    /**
     * removeItemFromTheSubscription
     * remove an item from the subscription items array
     * @param subscriptionItemId
     */
    public async removeItemFromTheSubscription(
        subscriptionItemId: string
    ): Promise<Stripe.Response<Stripe.DeletedSubscriptionItem>> {
        try {
            // delete subscription item
            return await this._stripe.subscriptionItems.del(subscriptionItemId);
        } catch (e) {
            throw new InternalServerErrorException(e.raw.message);
        }
    }

    /**
     * cancelSubscription
     * cancel subscription on the Stripe
     * @param subscriptionId
     */
    public async cancelSubscription(
        subscriptionId: string
    ): Promise<Stripe.Response<Stripe.Subscription>> {
        try {
            // delete subscription on stripe
            return await this._stripe.subscriptions.del(subscriptionId);
        } catch (e) {
            throw new InternalServerErrorException(e.raw.message);
        }
    }

    /**
     * updateSubscriptionPaymentMethod
     * @param customerId
     * @param subscriptionId
     * @param oldPaymentMethod
     * @param newPaymentMethod
     */
    public async updateSubscriptionPaymentMethod(
        customerId: string,
        subscriptionId: string,
        oldPaymentMethod: string,
        newPaymentMethod: string
    ): Promise<Stripe.Response<Stripe.Subscription>> {
        try {
            // detach old payment method from the customer account
            await this._stripe.paymentMethods.detach(oldPaymentMethod);
            // attach new payment method to the customer account
            await this._stripe.paymentMethods.attach(newPaymentMethod, { customer: customerId });
            // update default payment method for the subscription
            return await this._stripe.subscriptions.update(subscriptionId, {
                default_payment_method: newPaymentMethod
            });
        } catch (e) {
            throw new InternalServerErrorException(e.raw.message);
        }
    }
}
