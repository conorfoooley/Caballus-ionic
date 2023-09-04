import { Injectable } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { from, Observable } from "rxjs";
import { map, switchMap, take, tap } from "rxjs/operators";
import { UserProfileImageModalComponent } from "../modals/user-profile-modal/user-profile-modal.component";

@Injectable({ providedIn: "root" })
export class UserModalService {
  constructor(private readonly _modalController: ModalController) {
  }

  public userProfileImage(userId: string): Observable<any> {
    const promise = this._modalController.create({
      cssClass: [
        "generic-ion-modal",
        "user-profile-modal"
      ],
      component: UserProfileImageModalComponent,
      componentProps: {
        userId
      }
    });
    return from(promise).pipe(
      take(1),
      tap(m => m.present()),
      switchMap(m => from(m.onDidDismiss())),
      map(detail => detail.data)
    );
  }
}
