import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RideCategory } from '@caballus/ui-common';

@Component({
    selector: 'app-category',
    templateUrl: './category.component.html',
    styleUrls: ['./category.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryComponent implements OnInit {
    public readonly RideCategory: typeof RideCategory = RideCategory;

    @Input()
    public form: FormGroup;

    constructor() { }

    public ngOnInit(): void {
    }
}
