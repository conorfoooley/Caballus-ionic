import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Ride, metersToFeet, WayPoint } from '@caballus/ui-common';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, shareReplay, takeUntil } from 'rxjs/operators';

function *pairWise<T>(input: Iterable<T>): Generator<[T, T]> {
    const iterator = input[Symbol.iterator]();
    let current = iterator.next();
    if (current.done) {
        return;
    }

    let next = iterator.next();
    while (!next.done) {
        yield [current.value, next.value];

        current = next;
        next = iterator.next();
    }
}

@Component({
    selector: 'app-elevation',
    templateUrl: './elevation.component.html',
    styleUrls: ['./elevation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElevationComponent {
    @Input()
    public wayPoints: WayPoint[] | null;

    public elevation(wayPoints: WayPoint[]): number {
        let total = 0;

        for (const [current, next] of pairWise(wayPoints)) {
            const difference = next.altitude - current.altitude;

            // Only summing up positive elevation change. That is if a horse
            // goes up a hill and then down the hill it should count that
            // elevation instead of zeroing out.
            if (difference > 0) {
                total += difference;
            }
        }

        return metersToFeet(total);
    }
}
