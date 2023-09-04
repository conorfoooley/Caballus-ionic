import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, iif, Observable, of, Subject, throwError } from 'rxjs';
import { Meta } from '@angular/platform-browser';
import { catchError, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { HorseService } from '@caballus/ui-common';
import { HorseBasicProfile, HorseBreed, kilometersToMiles, minutesToHours, kgToLbs, meterToHands } from '@caballus/ui-common';
import { AlertController } from '@ionic/angular';

@Component({
    selector: 'app-horse-basic-profile',
    templateUrl: './basic-profile.component.html',
    styleUrls: ['./basic-profile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicProfileComponent implements OnInit, OnDestroy {
    private _onViewWillLeave$: Subject<void> =
        new Subject();
    private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
        map(params => params.get('horseId')),
        shareReplay(1)
    );
    public horse$: BehaviorSubject<HorseBasicProfile> =
        new BehaviorSubject(null);
    public HorseBreed: typeof HorseBreed = HorseBreed;
    public readonly kilometersToMiles: (k: number) => number = kilometersToMiles;
    public readonly minutesToHours: (k: number) => number = minutesToHours;
    public readonly kgToLbs: (k: number) => number = kgToLbs;
    public readonly meterToHands: (k: number) => number = meterToHands;
    constructor(
        private readonly _meta: Meta,
        private readonly _activatedRoute: ActivatedRoute,
        private readonly _horseService: HorseService,
        private readonly _alertController: AlertController
    ) { }

    public ngOnInit(): void {

        this._horseId$.pipe(
            take(1),
            filter(id => !!id),
            switchMap(id =>
                iif(() => !!id,
                    this._horseService.getBasicHorseProfile(id), throwError('This horse is not public.  The horse must be made public before you can view it.'))
            ),
            tap(h => {
                this.horse$.next(h);
                this._meta.addTags([
                    { name: 'title', content: `Caballus Horse Profile for ${h.registeredName}` },
                    { property: 'og:image', content: h?.profilePicture?.url || './assets/icons/horse-placeholder.svg' }
                ]);
            }),
            catchError(async () => {
                const alert = await this._alertController.create({
                    message: 'This horse is not public.  The horse must be made public before you can view it.',
                    buttons: ['OK']
                });
                await alert.present();
                await alert.onDidDismiss();
                return of(null);
            })
        ).subscribe();
    }

    public ngOnDestroy(): void {
        this._onViewWillLeave$.next();
        this._onViewWillLeave$.complete();
    }
}
