import { Component, OnInit } from '@angular/core';
import { AppHorseDetail } from '@caballus/ui-common';

@Component({
    selector: 'app-horse-detail',
    templateUrl: './horse-detail.component.html',
    styleUrls: ['./horse-detail.component.scss']
})
export class HorseDetailComponent implements OnInit {
    public selectedMenuItem: AppHorseDetail = AppHorseDetail.Analytics;
    constructor(

    ) { }

    public ngOnInit(): void {
    }
}
