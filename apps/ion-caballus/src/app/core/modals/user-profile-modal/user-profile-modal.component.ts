import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { LoadingController, ModalController } from "@ionic/angular";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { dataURItoBlob } from "@caballus/common";
import { UserProfile, UserService } from "@caballus/ui-common";
import { CapacitorPluginService, ModalService } from "@ion-caballus/core/services";
import { ToastService } from "@rfx/ngx-toast";
import { BehaviorSubject, of } from "rxjs";
import { catchError, switchMap, take, tap } from "rxjs/operators";

const PLACEHOLDER_IMAGE_URL = "/assets/icons/user-placeholder.svg";

@Component({
  selector: "app-user-profile-modal",
  templateUrl: "./user-profile-modal.component.html",
  styleUrls: ["./user-profile-modal.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileImageModalComponent implements OnInit {
  @Input()
  public userId!: string;
  public user$: BehaviorSubject<UserProfile> = new BehaviorSubject(null);
  public profilePictureUrl$: BehaviorSubject<string | SafeResourceUrl> =
    new BehaviorSubject<string | SafeResourceUrl>(PLACEHOLDER_IMAGE_URL);
  public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private readonly _userService: UserService,
    private readonly _sanitizer: DomSanitizer,
    private readonly _capacitorPluginService: CapacitorPluginService,
    private readonly _modalService: ModalService,
    private readonly _modalController: ModalController,
    private readonly _toastService: ToastService,
    private readonly _loader: LoadingController
  ) {
  }

  @ViewChild("attachmentInput", { static: true })
  private _attachmentInput: HTMLInputElement;
  public set attachmentInput(val: ElementRef<HTMLInputElement>) {
    this._attachmentInput = val.nativeElement;
  }

  public attachmentUrl: SafeResourceUrl;

  public attachment: Blob;

  public ngOnInit(): void {
    this.getUerData(this.userId);
  }

  public uploadProfilePicture(url: Blob): void {
    let loader;
    this._loader
      .create({
        message: "Uploading profile picture..."
      })
      .then((data) => {
        loader = data;
        loader.present();
        this._userService
          .uploadImageToUserProfile(this.userId, url)
          .pipe(
            tap(() => loader.dismiss())
          )
          .subscribe(() => {
            this.goBack();
          });
      });
  }

  public async attachImage(): Promise<void> {
    this.attachment = await this._capacitorPluginService.getAttachment(
      this._attachmentInput["nativeElement"]
    );
    const url = URL.createObjectURL(this.attachment);
    // sanitize attachment url
    this.attachmentUrl = this._sanitizer.bypassSecurityTrustResourceUrl(url);
    this.profilePictureUrl$.next(this.attachmentUrl as SafeResourceUrl);
    await this.isEdit();
  }

  public async isEdit(): Promise<void> {
    const cropper = await this._modalService.profileImageCropperModal(
      this.profilePictureUrl$.getValue()
    );
    const cropperRes = await cropper.onDidDismiss();

    if (cropperRes && cropperRes.data) {
      const newProfileBlob = dataURItoBlob(cropperRes.data);

      const url = URL.createObjectURL(newProfileBlob);
      this.profilePictureUrl$.next(cropperRes.data);

      // update profile picture
      await this.uploadProfilePicture(newProfileBlob);
    }
    if (
      this._attachmentInput["nativeElement"] &&
      this._attachmentInput["nativeElement"].value
    ) {
      this._attachmentInput["nativeElement"].value = "";
    }
  }

  public dismissModal(): void {
    this.user$
      .pipe(
        take(1),
        switchMap((user) => this._modalController.dismiss(user))
      )
      .subscribe();
  }

  private async getUerData(userId: string): Promise<void> {
    this._userService
      .getProfile(userId)
      .pipe(
        take(1),
        catchError((err) => {
          this._toastService.error(err);
          return of(null);
        })
      )
      .subscribe((res) => {
        this.user$.next(res);
        if (res.profilePicture && res.profilePicture.url) {
          this.profilePictureUrl$.next(res.profilePicture.url as string);
        }
      });
  }

  public goBack(): void {
    window.history.back();
    this.dismissModal();
  }
}
