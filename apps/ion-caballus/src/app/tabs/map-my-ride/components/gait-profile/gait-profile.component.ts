import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { FormControl, FormControlName, FormGroup } from '@angular/forms';
import { Gait, ToastService } from '@caballus/ui-common';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Component({
    selector: 'caballus-app-gait-profile',
    templateUrl: './gait-profile.component.html',
    styleUrls: ['./gait-profile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GaitProfileComponent implements OnInit {
    @Input()
    public form: FormGroup;
    @Input()
    public gaitData$!: Subject<Gait>;
    public displayedColumns: string[] = ['Gait', 'Time'];
    public Gait: typeof Gait = Gait;
    public gaitNewData$: Subject<Gait> =
    new Subject();

    public gaitOldData: any;

    constructor(private readonly _toastService: ToastService) { }

    ngOnInit(): void {
        this.setGaitData();
    }

    public setGaitData(): void {
        this.gaitData$.subscribe((resp: any) => {
            if (resp) {
                for (const key in resp) {
                    this.form.addControl(key, new FormControl(resp[key].duration));
                }
            }
            this.gaitNewData$.next(resp);
            this.gaitOldData = resp;
        });
    }

    public resetDuration(): void {
        console.log(this.form.value, 'form');
        for (const key in this.gaitOldData) {
            this.form.get(key).setValue(this.gaitOldData[key].duration);
        }
    }

    public notifyUser(): void {
        this._toastService.success('Modifying gait profile here will mark the ride as manually entered data');
    }
}

