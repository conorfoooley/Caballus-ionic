import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrModule } from 'ngx-toastr';
import { modals } from './core/modals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { RfxGridModule } from '@rfx/ngx-grid';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { IonicModule } from "@ionic/angular";
@NgModule({
    declarations: [...modals],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    PdfViewerModule,
    MatIconModule,
    RfxGridModule,
    ToastrModule.forRoot({
      tapToDismiss: true,
      newestOnTop: true,
      progressBar: true,
      progressAnimation: "decreasing",
      timeOut: 5000,
      extendedTimeOut: 1000,
      easeTime: 300
    }),
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    IonicModule
  ],
    exports: [RfxGridModule],
    entryComponents: [...modals]
})
export class UiCommonModule {}
