import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ViewChild,
  ElementRef
} from "@angular/core";
import { ToastService } from "@rfx/ngx-toast";
import { HorseCache } from "../../caches/horse/horse.cache";
import { ModalController } from "@ionic/angular";
import { BehaviorSubject, from, iif, Observable, of, timer } from "rxjs";
import { catchError, finalize, map, mapTo, switchMap, take, tap } from "rxjs/operators";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { SelectOption } from "@rfx/common";
import { HorseHealthSimple, HorseHealthType, bytesToMB, Media } from "@caballus/ui-common";
import { DeleteHorseHealthModalComponent } from "../delete-horse-health-modal/delete-horse-health-modal.component";

const INVALID_FILE_WARNING =
  "Allowed filesized (50Mb) exceeded or an incorrect format and will not be uploaded. Upload failed";

const MAX_ATTACHMENT_WARNING = "Allowed maximum 2 attachments";

const MAX_FILE_SIZE_IN_MB = 50;
const MAXIMUM_FILES = 2;
const MAXIMUM_NOTES_LENGTH = 250;
const MAX_FILE_NAME_LENGTH = 14;
const DELETE_CLOSE_MODAL_TIMEOUT = 100;
const TARGET_BLANK = "_blank";
const ACCEPTS_FILE_TYPES = [
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf",
  ".doc",
  ".docx",
  ".pages",
  ".epub",
  ".txt",
  ".rtf",
  ".zip",
  ".mov",
  ".mp4"
];

@Component({
  selector: "app-horse-health-modal",
  templateUrl: "./horse-health-modal.component.html",
  styleUrls: ["./horse-health-modal.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorseHealthModalComponent implements OnInit {
  public notesLength: number = MAXIMUM_NOTES_LENGTH;
  public HorseHealthType: typeof HorseHealthType = HorseHealthType;
  @Input()
  public horseHealth!: HorseHealthSimple;
  @Input()
  public horseId!: string;
  public horseHealthType!: HorseHealthType;
  public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public horseHealthTypeOptions: SelectOption[] = [
    ...HorseHealthType.members.map(type => ({
      value: type,
      label: HorseHealthType.toString(type)
    }))
  ];
  public horseHealthForm: FormGroup = this._formBuilder.group({
    date: ["", Validators.required],
    notes: ["", [Validators.required, Validators.maxLength(MAXIMUM_NOTES_LENGTH)]]
  });
  public newDocuments$: BehaviorSubject<File[]> = new BehaviorSubject([]);
  public existingDocuments$: BehaviorSubject<Media[]> = new BehaviorSubject([]);
  @ViewChild("fileElement", { static: true })
  public fileElement: ElementRef;
  public validations = {
    date: [{ type: "required", message: "Date is required." }],
    // other validations
    notes: [
      { type: "required", message: "Notes is required." },
      {
        type: "maxlength",
        message: `Notes cannot be more than ${MAXIMUM_NOTES_LENGTH} characters long.`
      }
    ]
  };

  constructor(
    private readonly _modalController: ModalController,
    private readonly _horseCache: HorseCache,
    private readonly _toastService: ToastService,
    private readonly _formBuilder: FormBuilder
  ) {
  }

  public ngOnInit(): void {
    if (this.horseHealth) {
      this.horseHealthForm.patchValue({
        date: this.horseHealth.date || "",
        notes: this.horseHealth.notes || ""
      });

      if (this.horseHealth.documents?.length) {
        this.existingDocuments$.next(
          this.horseHealth.documents.map(({ latest, ...rest }) => ({
            ...rest,
            latest,
            displayName: this.displayFileName(latest.name)
          }))
        );
      }
    }
  }

  public onSave(): void {
    if (this.horseHealthForm.invalid) {
      return;
    }
    this.newDocuments$
      .pipe(
        take(1),
        tap(documents => {
          this.isLoading$.next(true);
          if (this.horseHealth && this.horseHealth._id) {
            this._horseCache
              .editHorseHealth(
                this.horseHealth._id,
                {
                  horseId: this.horseId,
                  horseHealthType: this.horseHealthType,
                  notes: this.horseHealthForm.value.notes,
                  date: this.horseHealthForm.value.date
                },
                documents
              )
              .pipe(
                take(1),
                tap(() =>
                  this._modalController.dismiss({
                    saved: true
                  })
                ),
                catchError(() => {
                  this._toastService.error("Error updating horse health");
                  return of(null);
                }),
                finalize(() => this.isLoading$.next(false))
              )
              .subscribe();
          } else {
            this._horseCache
              .createHorseHealth(
                {
                  horseId: this.horseId,
                  horseHealthType: this.horseHealthType,
                  notes: this.horseHealthForm.value.notes,
                  date: this.horseHealthForm.value.date
                },
                documents
              )
              .pipe(
                take(1),
                tap(() =>
                  this._modalController.dismiss({
                    saved: true
                  })
                ),
                catchError(() => {
                  this._toastService.error("Error creating horse health");
                  return of(null);
                }),
                finalize(() => this.isLoading$.next(false))
              )
              .subscribe();
          }
        })
      )
      .subscribe();
  }

  public goBack(): void {
    this._modalController.dismiss({ saved: false, deleted: false });
  }

  public onFilesAdded(e: Event): void {
    const target = e.target as HTMLInputElement;
    const fileList = target.files;
    const files = Array.from(fileList) as File[];
    if (this._isValidFiles(files)) {
      this.newDocuments$.next([...this.newDocuments$.getValue(), ...files]);
    }
  }

  private _isValidFiles(files): boolean {
    if (
      this.existingDocuments$.getValue().length +
      this.newDocuments$.getValue().length +
      files.length >
      MAXIMUM_FILES
    ) {
      this._toastService.error(MAX_ATTACHMENT_WARNING);
      this.fileElement.nativeElement.value = null;
      return false;
    }
    const validFileTypes = files.every(file => {
      const splits = file.name.split(".");
      let ext = splits[splits.length - 1];
      if (typeof ext === "undefined") {
        ext = "";
      }
      if (!ACCEPTS_FILE_TYPES.includes("." + ext)) {
        return false;
      }
      if (bytesToMB(file.size) > MAX_FILE_SIZE_IN_MB) {
        return false;
      }
      return true;
    });
    if (!validFileTypes) {
      this._toastService.error(INVALID_FILE_WARNING);
      this.fileElement.nativeElement.value = null;
      return false;
    }
    return validFileTypes;
  }

  public displayFileName(fileName: string): string {
    let displayName = fileName;
    if (fileName.length > MAX_FILE_NAME_LENGTH) {
      const fileNameArr = fileName.split(".");
      const ext = fileNameArr.pop();
      displayName = fileNameArr.join(".").substr(0, MAX_FILE_NAME_LENGTH) + "..." + ext;
    }
    return displayName;
  }

  public deleteNewDocument(deletedIndex: number): void {
    this.newDocuments$
      .pipe(
        take(1),
        tap(documents => {
          documents.splice(deletedIndex, 1);
          this.newDocuments$.next(documents);
        })
      )
      .subscribe();
  }

  public deleteExistingDocument(id: string): void {
    this.isLoading$.next(true);
    this._horseCache
      .deleteHorseHealthDocument(id, this.horseId)
      .pipe(
        switchMap(() => this.existingDocuments$),
        tap(documents => {
          this.existingDocuments$.next(documents.filter(({ _id }) => _id !== id));
          this.isLoading$.next(false);
        }),
        catchError(() => {
          this._toastService.error("Error deleting horse health document");
          return of(null);
        }),
        finalize(() => this.isLoading$.next(false))
      )
      .subscribe();
  }

  public deleteHorseHealth(): void {
    this.deleteHorseHealthModal(this.horseHealth._id, this.horseId)
      .pipe(
        switchMap(({ deleted }) =>
          iif(
            () => !!deleted,
            timer(DELETE_CLOSE_MODAL_TIMEOUT).pipe(mapTo(deleted)),
            of(undefined)
          )
        ),
        tap(deleted => {
          if (deleted) {
            this._toastService.success("Record has been deleted");
            this._modalController.dismiss({ deleted: true });
          }
        })
      )
      .subscribe();
  }

  public previewSelectedFile(file: File): void {
    window.open(URL.createObjectURL(file), TARGET_BLANK);
  }

  public deleteHorseHealthModal(
    horseHealthId: string,
    horseId: string
  ): Observable<{ deleted: boolean }> {
    const promise = this._modalController.create({
      cssClass: "delete-horse-health-modal",
      component: DeleteHorseHealthModalComponent,
      componentProps: {
        horseHealthId,
        horseId
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
