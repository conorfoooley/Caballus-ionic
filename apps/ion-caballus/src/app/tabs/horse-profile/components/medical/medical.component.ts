import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  HorseHealthSimple,
  HorseHealthType,
  HorseVeterinarianProfile,
  HorsePermission
} from "@caballus/ui-common";
import { ToastService } from "@rfx/ngx-toast";
import { BehaviorSubject, combineLatest, from, iif, Observable, of, Subject } from "rxjs";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { catchError, map, shareReplay, switchMap, take, tap } from "rxjs/operators";
import { State } from "@rfx/ngx-forms";
import { HorseCache } from "@ion-caballus/core/caches";
import { groupBy } from "lodash";
import { ModalService } from "@ion-caballus/core/services";

interface PanelStateModel {
  item: HorseHealthType;
  open: boolean;
}

const MAX_FILE_NAME_LENGTH = 14;
const MAX_LENGTH = {
  FULL_NAME: 50,
  ADDRESS: {
    LINE1: 50,
    CITY: 50,
    STATE: 6,
    POSTAL_CODE: 6
  }
};

@Component({
  selector: "app-medical",
  templateUrl: "./medical.component.html",
  styleUrls: ["./medical.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicalComponent implements OnInit {
  public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private _onDestroy$: Subject<void> = new Subject<void>();
  public canEdit$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private _horseId$: Observable<string> = this._activatedRoute.paramMap.pipe(
    map(params => params.get("horseId")),
    shareReplay(1)
  );
  public readonly HorseHealthType: typeof HorseHealthType = HorseHealthType;
  public panelOpenState: Record<string, PanelStateModel> = {
    [HorseHealthType.Health]: { item: HorseHealthType.Health, open: false },
    [HorseHealthType.Farrier]: { item: HorseHealthType.Farrier, open: false },
    [HorseHealthType.Vaccination]: { item: HorseHealthType.Vaccination, open: false },
    [HorseHealthType.Evaluation]: { item: HorseHealthType.Evaluation, open: false }
  };
  public editContact = false;

  public contactForm: FormGroup = this._formBuilder.group({
    fullName: [null, Validators.maxLength(MAX_LENGTH.FULL_NAME)],
    email: [null, Validators.email],
    phone: [null],
    address: this._formBuilder.group({
      line1: [null, Validators.maxLength(MAX_LENGTH.ADDRESS.LINE1)],
      city: [null, Validators.maxLength(MAX_LENGTH.ADDRESS.CITY)],
      state: [null, Validators.maxLength(MAX_LENGTH.ADDRESS.STATE)],
      postalCode: [null, Validators.maxLength(MAX_LENGTH.ADDRESS.POSTAL_CODE)]
    })
  });

  public validations = {
    fullName: [
      { type: "required", message: "Full Name is required." },
      {
        type: "maxlength",
        message: `Full Name cannot be more than ${MAX_LENGTH.FULL_NAME} characters long.`
      }
    ],
    phone: [{ type: "maxlength", message: "Full Name is required." }],
    email: [
      { type: "required", message: "Email is required." },
      { type: "email", message: " Please enter a valid email address." }
    ],
    line1: [
      { type: "required", message: "Address Line1 is required." },
      {
        type: "maxlength",
        message: `Address Line1 cannot be more than ${MAX_LENGTH.ADDRESS.LINE1} characters long.`
      }
    ],

    city: [
      { type: "required", message: "Address City is required." },
      {
        type: "maxlength",
        message: `Address City cannot be more than ${MAX_LENGTH.ADDRESS.LINE1} characters long.`
      }
    ],

    state: [
      { type: "required", message: "Address State is required." },
      {
        type: "maxlength",
        message: `Address State cannot be more than ${MAX_LENGTH.ADDRESS.STATE} characters long.`
      }
    ],

    postalCode: [
      { type: "required", message: "Address Postal Code is required." },
      {
        type: "maxlength",
        message: `Address Postal Code cannot be more than ${MAX_LENGTH.ADDRESS.POSTAL_CODE} characters long.`
      }
    ]
  };

  public states: { key: string; name: string }[] = State.members.map(t => ({
    key: t,
    name: State.toString(t)
  }));
  public horseHealth$: BehaviorSubject<{
    [key: string]: HorseHealthSimple[];
  }> = new BehaviorSubject({});
  private _horseVeterinarianProfile$: BehaviorSubject<
    HorseVeterinarianProfile
  > = new BehaviorSubject(null);

  constructor(
    private readonly _toastService: ToastService,
    private readonly _router: Router,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _formBuilder: FormBuilder,
    private readonly _horseCache: HorseCache,
    private readonly _modalService: ModalService
  ) {
  }

  public ngOnInit(): void {
    this._getHorseHealths();
    this._getHorseVeterinarianProfile();
  }

  public get address(): FormGroup {
    return this.contactForm.get('address') as FormGroup;
  }

  private _getHorseHealths(): void {
    this._horseId$
      .pipe(
        take(1),
        switchMap(id =>
          iif(
            () => !!id,
            combineLatest([
              from(this._horseCache.getHorseRelationships(id)),
              from(this._horseCache.getHorseHealthByHorseId(id))
            ]).pipe(take(1)),
            of(null)
          )
        ),
        tap(([relationship, horseHealths]) => {
          this.canEdit$.next(
            !!relationship.loggedInUserRole.permissions.includes(
              HorsePermission.HorseEdit
            )
          );
          this.horseHealth$.next(groupBy(horseHealths, "horseHealthType"));
        }),
        catchError(() => {
          this._toastService.error("Error getting relationship or total stats");
          return of(null);
        })
      )
      .subscribe();
  }

  private _getHorseVeterinarianProfile(): void {
    this._horseId$
      .pipe(
        take(1),
        switchMap((id: string) =>
          iif(
            () => !!id,
            this._horseCache.getHorseVeterinarianProfileByHorseId(id),
            of(null)
          )
        ),
        tap((veterinarianProfile: HorseVeterinarianProfile) => {
          this._horseVeterinarianProfile$.next(veterinarianProfile);
          this.contactForm.patchValue(veterinarianProfile);
        }),
        catchError(() => {
          this._toastService.error("Error getting relationship or total stats");
          return of(null);
        })
      )
      .subscribe();
  }

  public ngOnDestroy(): void {
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }

  public backToHorseList(): void {
    this._router.navigateByUrl("/tabs/horse-profile");
  }

  public openPanel(menuItem: HorseHealthType): void {
    this.panelOpenState[menuItem].open = true;
  }

  public onContactEdit(): void {
    this.editContact = true;
  }

  public submitContactForm(): void {
    this.isLoading$.next(true);
    this._horseId$
      .pipe(
        take(1),
        switchMap(id =>
          iif(
            () => !!id,
            this._horseCache.updateHorseVeterinarianProfileByHorseId(
              {
                ...this.contactForm.value,
                phone: String(this.contactForm.value.phone)
              },
              id
            ),
            of(null)
          )
        ),
        tap(() => {
          this._toastService.success("Horse veterinarian profile is saved");
          this.editContact = false;
          this.isLoading$.next(false);
          this._horseVeterinarianProfile$.next(this.contactForm.value);
        }),
        catchError(() => {
          this._toastService.error("Error updating horse veterinarian profile");
          this.isLoading$.next(false);
          return of(null);
        })
      )
      .subscribe();
  }

  public onCancelContact(): void {
    this.editContact = false;
    this.resetContactForm();
  }

  public resetContactForm(): void {
    this._horseVeterinarianProfile$
      .pipe(
        take(1),
        tap(horseVeterinarianProfile =>
          this.contactForm.patchValue(horseVeterinarianProfile)
        )
      )
      .subscribe();
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

  public addEditHorseHealthModal(
    horseHealthType: HorseHealthType,
    horseHealth?: HorseHealthSimple
  ): void {
    this._horseId$
      .pipe(
        switchMap(id =>
          iif(
            () => !!id,
            this._modalService.addEditHorseHealthModal(
              horseHealth,
              id,
              horseHealthType
            ),
            of(null)
          )
        ),
        map(({ saved, deleted }: { saved: boolean; deleted: boolean }) => {
          if (saved) {
            this._toastService.success("Horse health is saved");
          }
          if (deleted) {
            this._toastService.success("Horse health is deleted");
          }
          this._getHorseHealths();
        })
      )
      .subscribe();
  }
}
