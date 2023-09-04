import { Injectable } from '@angular/core';
import { StripeService } from 'ngx-stripe';
import { Observable } from 'rxjs';
import { StripeElements } from '@stripe/stripe-js';
@Injectable({
    providedIn: 'root'
})
export class CheckoutService {
    private _event: Event;
    private _event$: Observable<Event>;
    private _elements$: Observable<StripeElements>;

    public get event$(): Observable<Event> {
        return this._event$;
    }
    public get elements$(): Observable<StripeElements> {
        return this._elements$;
    }

    constructor(private _stripeService: StripeService) {
        this._elements$ = this._stripeService.elements({}).pipe();
    }
}
