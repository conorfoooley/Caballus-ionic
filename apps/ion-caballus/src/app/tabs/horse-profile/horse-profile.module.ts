import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RfxFormsModule } from '@rfx/ngx-forms';
import { AppHorseDetail, UiCommonModule } from '@caballus/ui-common';
import { UiLibraryModule } from '@caballus/ui-library';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HorseListComponent } from './pages/horse-list/horse-list.component';
import { HorseDetailComponent } from './pages/horse-detail/horse-detail.component';
import { GeneralHorseDetailComponent } from './components/general-info/general-horse-detail.component';
import { MatCardModule } from '@angular/material/card';
import { InvitesPermissionsComponent } from './pages/invites-permissions/invites-permissions.component';
import { InvitationCardComponent } from './components/invitation-card/invitation-card.component';
import { PublicPermissionsComponent } from './pages/public-permissions/public-permissions.component';
import { AddUserToHorseComponent } from './pages/add-user-to-horse/add-user-to-horse.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MedicalComponent } from './components/medical/medical.component';
import { UserComponent } from './components/user/user.component';
import { NgChartsModule } from 'ng2-charts';
import { CreateHorseProfileComponent } from './pages/create-horse-profile/create-horse-profile.component';
import { MatSelectModule } from '@angular/material/select';
import { HorseProfileGalleryComponent } from './pages/horse-photo-gallery/horse-photo-gallery.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { EvaluationComponent } from './components/evaluation/evaluation.component';
import { AddEditEvaluationComponent } from './components/add-update-evaluation/add-update-evaluation.component';
import { CompetitionComponent } from './components/competition/competition.component';
import { AddEditCompetitionComponent } from './components/add-update-competition/add-update-competition.component';
import { RideHistoryComponent } from './components/ride-history/ride-history.component';
import { TransferHorseComponent } from './components/transfer-horse/transfer-horse.component';
import { ViewRideDetailComponent } from './components/view-ride-detail/view-ride-detail.component';
import { ViewRideEntryDetailComponent } from './components/view-ride-entry-detail/view-ride-entry-detail.component';
import { SharedModule } from '../../shared/shared.module';
import { AddRideHistoryComponent } from '../../shared/add-ride-history/add-ride-history.component';
@NgModule({
    declarations: [
        HorseListComponent,
        HorseDetailComponent,
        GeneralHorseDetailComponent,
        InvitesPermissionsComponent,
        PublicPermissionsComponent,
        AddUserToHorseComponent,
        InvitationCardComponent,
        MedicalComponent,
        UserComponent,
        HorseProfileGalleryComponent,
        CreateHorseProfileComponent,
        EvaluationComponent,
        AddEditEvaluationComponent,
        CompetitionComponent,
        AddEditCompetitionComponent,
        RideHistoryComponent,
        TransferHorseComponent,
        ViewRideDetailComponent,
        // RideHistoryAddComponent,
        ViewRideEntryDetailComponent
    ],
    imports: [
        MatCardModule,
        CommonModule,
        IonicModule,
        FormsModule,
        ReactiveFormsModule,
        RfxFormsModule,
        UiCommonModule,
        UiLibraryModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatSelectModule,
        MatCardModule,
        MatExpansionModule,
        NgChartsModule,
        MatDatepickerModule,
        SharedModule,
        RouterModule.forChild([
            {
                path: 'create-horse',
                component: CreateHorseProfileComponent
            },
            {
                path: '',
                component: HorseListComponent
            },
            {
                path: 'invitation/:inviteId',
                component: HorseListComponent
            },
            {
                path: 'detail-horse',
                component: HorseDetailComponent,
                data: {
                    enableSubMenu: true
                },
                children: [
                    {
                        path: 'general-tab/:horseId',
                        component: GeneralHorseDetailComponent,
                        data: {
                            selectedMenuItem: AppHorseDetail.General
                        }
                    },
                    {
                        path: 'analytics/:horseId',
                        component: GeneralHorseDetailComponent,
                        data: {
                            selectedMenuItem: AppHorseDetail.Analytics
                        }
                    },
                    {
                        path: 'invites-permissions/:horseId',
                        component: InvitesPermissionsComponent
                    },
                    {
                        path: 'public-permissions/:horseId',
                        component: PublicPermissionsComponent
                    },
                    {
                        path: 'add-user/:horseId/:roleId',
                        component: AddUserToHorseComponent
                    },
                    {
                        path: 'medical/:horseId',
                        component: MedicalComponent
                    },
                    {
                        path: 'horse-photo-gallery/:horseId/:flow',
                        component: HorseProfileGalleryComponent
                    },
                    {
                        path: 'evaluations/:horseId',
                        component: EvaluationComponent
                    },
                    {
                        path: 'evaluations/:horseId/create',
                        component: AddEditEvaluationComponent
                    },
                    {
                        path: 'evaluations/:horseId/:evaluationId',
                        component: AddEditEvaluationComponent
                    },
                    {
                        path: 'competitions/:horseId',
                        component: CompetitionComponent
                    },
                    {
                        path: 'competitions/:horseId/create',
                        component: AddEditCompetitionComponent
                    },
                    {
                        path: 'competitions/:horseId/:competitionId',
                        component: AddEditCompetitionComponent
                    },
                    {
                        path: 'ride-history/:horseId',
                        component: RideHistoryComponent
                    },
                    {
                        path: 'ride-history-add/:horseId',
                        component: AddRideHistoryComponent
                    },
                    {
                        path: 'transfer-horse/:horseId',
                        component: TransferHorseComponent
                    },
                    {
                        path: 'view-ride-detail/:horseId/:rideId',
                        component: ViewRideDetailComponent
                    },
                    {
                        path: 'view-ride-detail/:horseId',
                        component: ViewRideDetailComponent
                    },

                    {
                        path: 'view-ride-entry-detail/:horseId',
                        component: ViewRideEntryDetailComponent
                    },
                    {
                        path: '**',
                        redirectTo: 'general-tab'
                    }
                ]
            },
            {
                path: '**',
                redirectTo: '/tabs/horse-profile'
            }
        ])
    ]
})
export class HorseProfileModule {}
