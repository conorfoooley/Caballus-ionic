import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import {
  ActionButtonModal,
  ConfirmModalComponent,
  HorseGeneralInvitationResponseModalComponent,
  HorseListModalComponent,
  HorseOwnershipTransferResponseModalComponent,
  MediaModalComponent,
  MediaSelectionSource,
  MessageModalComponent,
  RideDistanceModalComponent,
  RideDurationModalComponent,
  RideNotesModalComponent,
  TermsModalComponent,
  UpdateSubscriptionPaymentMethodModalComponent,
  WelcomeModalComponent
} from "../modals";
import {
  TransferSubscriptionModalComponent
} from "../modals/transfer-subscription-modal/transfer-subscription-modal.component";
import { HorseSummaryForInvitation, User } from "../models";
import { HorseDetails } from "@caballus/ui-common";

@Injectable({
  providedIn: "root"
})
export class ModalService {
  constructor(private readonly _dialog: MatDialog) {
  }

  public closeAll(): void {
    this._dialog.closeAll();
  }

  public termsAndConditions(
    termsAccepted: boolean,
    pdfSource: string
  ): MatDialogRef<TermsModalComponent> {
    return this._dialog.open(
      TermsModalComponent,
      {
        autoFocus: false,
        maxHeight: "90vh",
        data: {
          accepted: termsAccepted,
          pdf: pdfSource
        }
      }
    );
  }

  public welcome(): MatDialogRef<WelcomeModalComponent> {
    return this._dialog.open(
      WelcomeModalComponent,
      {
        autoFocus: false,
        maxHeight: "90vh"
      }
    );
  }

  public horseList(
    horses: HorseDetails[]
  ): MatDialogRef<HorseListModalComponent> {
    return this._dialog.open(
      HorseListModalComponent,
      {
        autoFocus: false,
        maxHeight: "90vh",
        disableClose: true,
        data: {
          horses
        }
      }
    );
  }

  public confirm(
    title: string,
    bodyHtml: string,
    confirm: string,
    component?: string,
    cancelText?: string
  ): MatDialogRef<ConfirmModalComponent> {
    return this._dialog.open(
      ConfirmModalComponent,
      {
        autoFocus: true,
        maxHeight: "90vh",
        disableClose: true,
        data: {
          title,
          bodyHtml,
          confirm,
          cancelText,
          component
        }
      }
    );
  }

  public message(
    title: string,
    bodyHtml: string,
    confirm: string
  ): MatDialogRef<MessageModalComponent> {
    return this._dialog.open(
      MessageModalComponent,
      {
        autoFocus: true,
        maxHeight: "90vh",
        data: {
          title,
          bodyHtml,
          confirm
        }
      }
    );
  }

  public rideDuration(
    duration: string
  ): MatDialogRef<RideDurationModalComponent,
    { changed: boolean; duration: string; reset: boolean }> {
    return this._dialog.open(
      RideDurationModalComponent,
      {
        autoFocus: true,
        maxHeight: "90vh",
        data: {
          duration
        }
      }
    );
  }

  public rideDistance(
    distance: number
  ): MatDialogRef<RideDistanceModalComponent,
    { changed: boolean; distance: number; reset: boolean }> {
    return this._dialog.open(
      RideDistanceModalComponent,
      {
        autoFocus: true,
        maxHeight: "90vh",
        data: {
          distance
        }
      }
    );
  }

  public rideNotes(
    notes: string
  ): MatDialogRef<RideNotesModalComponent, { changed: boolean; notes: string }> {
    return this._dialog.open(
      RideNotesModalComponent,
      {
        autoFocus: true,
        maxHeight: "90vh",
        data: {
          notes
        }
      }
    );
  }

  public media(
    title: string, isWeb: boolean
  ): MatDialogRef<MediaModalComponent, MediaSelectionSource | undefined> {
    return this._dialog.open(MediaModalComponent, {
      autoFocus: true,
      maxHeight: "90vh",
      width: "80vh",
      data: {
        title,
        isWeb
      }
    });
  }

  public ownershipTransferResponse(
    horseSummary: HorseSummaryForInvitation,
    inviteId: string
  ): MatDialogRef<HorseOwnershipTransferResponseModalComponent> {
    return this._dialog.open(
      HorseOwnershipTransferResponseModalComponent,
      {
        autoFocus: false,
        maxHeight: "90vh",
        data: {
          summary: horseSummary,
          inviteId: inviteId
        }
      }
    );
  }

  public generalInvitationResponse(
    horseSummary: HorseSummaryForInvitation,
    inviteId: string
  ): MatDialogRef<HorseGeneralInvitationResponseModalComponent> {
    return this._dialog.open(
      HorseGeneralInvitationResponseModalComponent,
      {
        autoFocus: false,
        maxHeight: "90vh",
        data: {
          summary: horseSummary,
          inviteId: inviteId
        }
      }
    );
  }

  public transferSubscription(user: User): MatDialogRef<TransferSubscriptionModalComponent> {
    return this._dialog.open(
      TransferSubscriptionModalComponent,
      {
        autoFocus: false,
        maxHeight: "90vh",
        data: {
          user: user
        }
      }
    );
  }

  public openActionDialog(
    title: string,
    description: string,
    buttonOneLabel?: string,
    buttonTwoLabel?: string,
    buttonThreeLabel?: string,
    buttonFourLabel?: string
  ): MatDialogRef<ActionButtonModal> {
    return this._dialog.open(ActionButtonModal, {
      autoFocus: false,
      maxHeight: "90vh",
      data: {
        title,
        description,
        buttonOneLabel,
        buttonTwoLabel,
        buttonThreeLabel,
        buttonFourLabel
      }
    });
  }

  public updateSubscriptionPaymentMethod(user: User, paymentMethodId: string): MatDialogRef<UpdateSubscriptionPaymentMethodModalComponent> {
    return this._dialog.open(
      UpdateSubscriptionPaymentMethodModalComponent,
      {
        autoFocus: false,
        maxHeight: "90vh",
        data: {
          user,
          paymentMethodId
        }
      }
    );
  }

  // public transferSubscriptionAcceptance(user: User): Observable<{ transferred: boolean }> {
  //     const promise = this._modalController.create({
  //         component: TransferSubscriptionAcceptanceModalComponent,
  //         componentProps: {
  //             user
  //         }
  //     });
  //     return from(promise).pipe(
  //         take(1),
  //         tap(m => m.present()),
  //         switchMap(m => from(m.onDidDismiss())),
  //         map(detail => detail.data)
  //     );
  // }

  // public idleLogout(
  //     secRemaining$: Observable<number>,
  //     userTookAction$: Observable<void>
  // ): MatDialogRef<IdleLogoutModalComponent> {
  //     const dialogRef: MatDialogRef<IdleLogoutModalComponent> = this._dialog.open(
  //         IdleLogoutModalComponent,
  //         {
  //             autoFocus: true,
  //             maxHeight: '90vh',
  //             disableClose: true,
  //             data: {
  //                 secRemaining$,
  //                 userTookAction$
  //             }
  //         }
  //     );
  //     return dialogRef;
  // }
}
