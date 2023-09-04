import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { HorseDetails, HorseProfileStatus, HorseService } from '@caballus/ui-common';
import { BehaviorSubject, Subject } from 'rxjs';

@Component({
    selector: 'caballus-app-horse-list',
    templateUrl: './horse-list.component.html',
    styleUrls: ['./horse-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorseListComponent implements OnInit {
    public horsesProfilesData$: BehaviorSubject<HorseDetails[]> = new BehaviorSubject([]);
    public options$: BehaviorSubject<HorseDetails[]> = new BehaviorSubject([]);
    public hasNoData = false;
    public HorseProfileStatus: typeof HorseProfileStatus = HorseProfileStatus;
    public horseStatusChangeLoaderMapper: Record<string, boolean> = {};

    private _onDestroy$: Subject<void> = new Subject();

    constructor(private readonly _horseService: HorseService) {}

    public ngOnInit(): void {
        this._refreshHorseList();
    }

    public trackByFn(index: number, horse: HorseDetails): string {
        return horse._id;
    }

    private _refreshHorseList(): void {
        this._horseService.getViewableHorses().subscribe(
            response => {
                if (!response.length) {
                    this.hasNoData = true;
                }
                this.horsesProfilesData$.next(response);
                this.options$.next(response);
            },
            err => {
                // this._toastService.error(err);
            }
        );
    }

    public toggleHorseStatus(horse: HorseDetails): void {
        if (this.horseStatusChangeLoaderMapper[horse._id]) {
            return;
        }
        this.horseStatusChangeLoaderMapper[horse._id] = true;
        this._horseService.toggleHorseProfileStatus(horse._id).subscribe(() => {
            this._refreshHorseList();
            this.horseStatusChangeLoaderMapper[horse._id] = false;
        });
    }

    public ngOnDestroy(): void {
        this._onDestroy$.next();
        this._onDestroy$.complete();
    }
}
