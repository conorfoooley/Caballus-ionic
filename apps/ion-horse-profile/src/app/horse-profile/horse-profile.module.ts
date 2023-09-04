import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { UiCommonModule } from '@caballus/ui-common';
import { UiLibraryModule } from '@caballus/ui-library';
import { BasicProfileComponent } from './pages/basic-profile/basic-profile.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
    declarations: [
        BasicProfileComponent,
        NotFoundComponent
    ],
    imports: [
        CommonModule,
        IonicModule,
        UiCommonModule,
        UiCommonModule,
        UiLibraryModule,
        RouterModule.forChild([
            {
                path: ':horseId',
                component: BasicProfileComponent
            },
            {
                path: '',
                component: NotFoundComponent
            },
            {
                path: '**',
                redirectTo: '/'
            }
        ])
    ]
})
export class HorseModule { }
