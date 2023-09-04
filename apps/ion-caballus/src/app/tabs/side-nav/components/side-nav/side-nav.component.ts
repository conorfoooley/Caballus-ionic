import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { AuthService, BranchService, MenuItem, User, UserService } from "@caballus/ui-common";
import { ToastService } from "@rfx/ngx-toast";
import { BehaviorSubject, of } from "rxjs";
import { Store } from "@ngxs/store";
import { catchError, take } from "rxjs/operators";
import { Share } from "@capacitor/share";
import { Clipboard } from "@capacitor/clipboard";
import { environment } from "@ion-caballus/env";
import { LogoutAction } from "@ion-caballus/core/state/actions";
import { Router } from "@angular/router";
import { Browser } from "@capacitor/browser";
import { CapacitorPluginService } from "@ion-caballus/core/services";
import { Platform } from "@ionic/angular";

@Component({
  selector: "app-side-nav",
  templateUrl: "./side-nav.component.html",
  styleUrls: ["./side-nav.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideNavComponent {
  public menuItems: MenuItem[];
  public user$: BehaviorSubject<User> = new BehaviorSubject(null);

  constructor(
    private readonly _authService: AuthService,
    private readonly _userService: UserService,
    private readonly _toastService: ToastService,
    private readonly _store: Store,
    private readonly _router: Router,
    private readonly _capacitorPluginService: CapacitorPluginService,
    private readonly _branchService: BranchService,
    private readonly _platform: Platform
  ) {
  }

  ionViewWillEnter(): void {
    this._userService
      .getLoggedInUser()
      .pipe(
        take(1),
        catchError(err => {
          this._toastService.error(err);
          return of(null);
        })
      )
      .subscribe(res => {
        this.user$.next(res);
      });
    this.menuItems = [
      new MenuItem({
        label: "My Profile",
        icon: ["fas", "user"],
        route: "myprofile"
      }),
      new MenuItem({
        label: "Notifications",
        icon: ["fas", "bell"],
        route: "notifications"
      }),
      new MenuItem({
        label: "Share/Invite",
        icon: ["fas", "share-alt"],
        route: ""
      }),
      new MenuItem({
        label: "Friends",
        icon: ["fas", "users"],
        route: "friends"
      }),
      new MenuItem({
        label: "Manage Account",
        icon: ["fas", "star"],
        route: ""
      })
    ];
  }

  public logout(): void {
    const request = indexedDB.deleteDatabase('common-data-user');

    request.onsuccess = () => {
      
    };
  
    request.onerror = (event) => {
      console.error('Error deleting IndexedDB');
    };
    this._store.dispatch(new LogoutAction()).pipe(take(1)).subscribe();
  }

  public async navigateToPage(menu: MenuItem): Promise<void> {
    if (menu.label === "Share/Invite") {
      await this.shareApp();
    } else if (menu.label === "Manage Account") {
      try {
        // check network status
        const networkStatus = await this._capacitorPluginService
          .networkStatus()
          .toPromise();
        if (networkStatus.connected) {
          // fire subscription token generation api
          const tokenResponse = await this._authService
            .generateAccountSubscriptionToken()
            .toPromise();
          if (tokenResponse.token) {
            const deeplink = await this._branchService.generateDeepLink(
              environment.ionBaseUrl,
              `/tabs/map-my-ride`,
              "subscriptionApp"
            );
            // open PWA app
            Browser.open({
              url: `${environment.ionHorseProfileUrl}?token=${tokenResponse.token}&deepLink=${deeplink}`
            });
          } else {
            // throw error when token generation fails
            this._toastService.error("Token generation failed");
          }
        } else {
          // throw error when network is not connected
          this._toastService.error(
            "You are offline. Account Management is only available when connected to the internet."
          );
        }
      } catch (e) {
        this._toastService.error("Share link invite failed!");
      }
    } else {
      this._router.navigate(["tabs", "menu", menu.route]);
    }
  }

  public async shareApp(): Promise<void> {
    if (this._platform.is("cordova")) {
      const title = "Caballus: The Trusted Horse Experience App";
      const text = `Join me to record horse history, track progress and share experiences.`;
      const deeplink = await this._branchService.generateDeepLink(
        environment.ionBaseUrl,
        `/tabs/menu`
      );

      Share.share({
        title,
        text,
        url: deeplink,
        dialogTitle: title // android only
      });
    } else {
      // copy link to the clipboard
      Clipboard.write({
        url: `${environment.ionBaseUrl}/tabs/menu`
      })
        .then(() => {
          this._toastService.success("App link copied");
        })
        .catch((err) => {
          this._toastService.error("Could not copy app link");
          console.log(err);
        });
    }
  }
}
