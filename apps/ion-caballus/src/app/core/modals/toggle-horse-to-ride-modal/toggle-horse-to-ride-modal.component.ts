import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { HorseForRide, kilometersToMiles, RideCategory } from "@caballus/ui-common";
import { Observable } from "rxjs";

@Component({
    selector: 'app-toggle-horse-to-ride-modal',
    templateUrl: './toggle-horse-to-ride-modal.component.html',
    styleUrls: ['./toggle-horse-to-ride-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleHorseToRideModalComponent implements OnInit {
    public readonly RideCategory: typeof RideCategory = RideCategory;
    public readonly kilometersToMiles: (k: number) => number = kilometersToMiles;

    @Input()
    public horse$!: Observable<HorseForRide>;
    @Input()
    public add$!: Observable<boolean>;

    constructor(private readonly _modalController: ModalController) {}

    public ngOnInit(): void {}

    public cancel(): void {
        this._modalController.dismiss(false);
    }

    public confirm(): void {
        this._modalController.dismiss(true);
    }
}
