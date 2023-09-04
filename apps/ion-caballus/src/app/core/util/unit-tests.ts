import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';

/*
    Work around for problems with testing component using
    OnPush change detection per https://github.com/angular/angular/issues/12313#issuecomment-528536934

    Added parameter to cycle change detection multiple times

    Pat D Jul 27 2021
*/
export async function runOnPushChangeDetection<T>(f: ComponentFixture<T>, cycles: number = 1): Promise<void> {
    const ref = f.debugElement.injector.get<ChangeDetectorRef>(
        ChangeDetectorRef as any
    );
    for (let i = 0; i < cycles; ++i) {
        ref.detectChanges();
        await f.whenStable();
    }
    return;
}
