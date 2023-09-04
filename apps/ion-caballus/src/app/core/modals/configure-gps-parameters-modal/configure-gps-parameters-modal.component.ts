import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ModalController, IonRange } from '@ionic/angular';
import { RIDE_POSITION_MINIMUM_ACCURACY_METERS$, RIDE_POSITION_DISTANCE_FILTER_METERS$ } from 'libs/common/src/lib/constants/constants';

@Component({
    selector: 'app-configure-gps-parameters-modal',
    templateUrl: './configure-gps-parameters-modal.component.html',
    styleUrls: ['./configure-gps-parameters-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigureGpsParametersModalComponent {
    public readonly initialAccuracy = RIDE_POSITION_MINIMUM_ACCURACY_METERS$.value;
    public readonly initialDistance = RIDE_POSITION_DISTANCE_FILTER_METERS$.value;

    constructor(private readonly _modalController: ModalController) { }

    public dismiss(): void {
        this._modalController.dismiss();
    }

    public updateAccuracy(event: Event): void {
        const target = event.target as unknown as IonRange;
        RIDE_POSITION_MINIMUM_ACCURACY_METERS$.next(target.value as number);
    }

    public updateDistance(event: Event): void {
        const target = event.target as unknown as IonRange;
        RIDE_POSITION_DISTANCE_FILTER_METERS$.next(target.value as number);
    }
}
