import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { HorsePermission } from '@caballus/ui-common';
import { HorseCache } from '@ion-caballus/core/caches';
import { ModalController } from '@ionic/angular';
import { ToastService } from '@rfx/ngx-toast';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

const PLACEHOLDER_IMAGE_URL = '/assets/images/horse-placeholder.png';
@Component({
    selector: 'app-horse-profile-image-modal',
    templateUrl: './horse-profile-image-modal.component.html',
    styleUrls: ['./horse-profile-image-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorseProfileImageModalComponent implements OnInit {
    @Input()
    public horseId!: string;
    public profilePictureUrl$: BehaviorSubject<string> = new BehaviorSubject(PLACEHOLDER_IMAGE_URL);
    public canEdit$: Observable<boolean>;
    // public isLoading$: BehaviorSubject<boolean> =
    //     new BehaviorSubject(false);
    constructor(
        private readonly _modalController: ModalController,
        private readonly _horseCache: HorseCache,
        private readonly _toastService: ToastService,
    ) { }

    public ngOnInit(): void {
        this._horseCache.getHorse(this.horseId).pipe(
            map(
                horse =>
                    (horse.profile &&
                        horse.profile.profilePicture &&
                        horse.profile.profilePicture.url) ||
                    PLACEHOLDER_IMAGE_URL
            ),
            tap(profilePictureUrl => {
                this.profilePictureUrl$.next(profilePictureUrl);
            }),
            catchError(() => of(PLACEHOLDER_IMAGE_URL))
        ).subscribe();
        this.canEdit$ = from(this._horseCache.getHorseRelationships(this.horseId)).pipe(
            map(
                relationship =>
                    relationship.loggedInUserRole.permissions.includes(HorsePermission.HorseEdit)
            ),
            catchError(() => {
                this._toastService.error('Error getting permissions');
                return of(null);
            })
        );
    }


    public dismissModal(flag: boolean = false): void {
        this._modalController.dismiss(flag);
    }

    public async changeProfileImage(): Promise<void> {
        this.dismissModal(true);
    }
}
