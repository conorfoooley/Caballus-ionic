import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Router } from "@angular/router";
import { MediaDocumentType, MediaUploadItem, ModalService, UserService } from "@caballus/ui-common";
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from "rxjs/operators";
import { BehaviorSubject, from, Observable, of, Subject } from "rxjs";
import { FormControl } from "@angular/forms";
import { Select } from "@ngxs/store";
import { MediaUploadQueueState, UserState } from "@ion-caballus/state";
import { MediaUploadQueueService } from "@ion-caballus/core/services";
import { Platform } from "@ionic/angular";
import { MediaSubjectType } from "@caballus/common";

@Component({
  selector: "app-share-ride-detail",
  templateUrl: "./upload-gallery.component.html",
  styleUrls: ["./upload-gallery.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadGalleryComponent {
  @Select(UserState.uploadUsingCellularData)
  public uploadUsingCellularData$: Observable<boolean>;

  @Select(MediaUploadQueueState.queuedMedias)
  public queuedItems$: Observable<MediaUploadItem[]>;

  @Select(MediaUploadQueueState.currentUploadingItemInQueue)
  public currentUploadingItemInQueue$: Observable<MediaUploadItem | undefined>;

  public uploadUsingCellularControl: FormControl = new FormControl(false);
  public isIos$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public MediaDocumentType: typeof MediaDocumentType = MediaDocumentType;
  public MediaSubjectType: typeof MediaSubjectType = MediaSubjectType;

  private _onDestroy$: Subject<void> = new Subject();

  constructor(
    private readonly _router: Router,
    private readonly _modalService: ModalService,
    private readonly _mediaUploadQueueService: MediaUploadQueueService,
    private readonly _userService: UserService,
    private readonly _platform: Platform
  ) {
  }

  public ionViewWillEnter(): void {
    this.isIos$.next(this._platform.is("ios"));

    this.uploadUsingCellularData$
      .pipe(takeUntil(this._onDestroy$))
      .subscribe((res) => this.uploadUsingCellularControl.patchValue(res));

    this.uploadUsingCellularControl.valueChanges
      .pipe(
        takeUntil(this._onDestroy$),
        distinctUntilChanged(),
        debounceTime(700),
        switchMap((res) => this._userService.allowCellularUpload(res))
      )
      .subscribe();
  }

  public ionViewWillLeave(): void {
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }

  public goBack(): void {
    this._router.navigate(["tabs", "map-my-ride"]);
  }

  public skipUploadConfirmation(itemId: string): void {
    this._modalService
      .confirm(
        "Skip?",
        "Skip this file?  (It will not be visible when you share it using the share function)",
        "Yes",
        "No"
      )
      .afterClosed()
      .pipe(
        filter((confirmed) => !!confirmed),
        switchMap((confirmed) => {
          if (confirmed) {
            return from(
              this._mediaUploadQueueService.updateItem({
                mediaId: itemId,
                isSkipped: true
              })
            );
          }
          return of(false);
        })
      )
      .subscribe();
  }
}
