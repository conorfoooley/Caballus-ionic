import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { paramsStream } from './shared';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    public title: string = 'ion-horse-profile';

    constructor(private readonly _activatedRoute: ActivatedRoute) {
        this._activatedRoute.queryParamMap.subscribe(params => {
            if (params.has('token')) {
                const paramsObject = {
                    token: params.get('token'),
                    deepLink: params.get('deepLink'),
                    subscriptionInvitationId: params.get('subscriptionInvitationId'),
                };
                paramsStream.next(paramsObject);
            }
        });
    }
}
