import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { Select } from "@ngxs/store";
import { AuthState, UserState } from "@ion-caballus/core/state";
import { BranchDeepLinks, BranchInitEvent } from "capacitor-branch-deep-links";
import { User } from "@caballus/ui-common";
import { Capacitor } from "@capacitor/core";
import { Platform } from "@ionic/angular";

declare let cordova: any;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  @Select(AuthState.authToken)
  public authToken$!: Observable<string>;
  @Select(AuthState.refreshToken)
  public refreshToken$!: Observable<string>;
  @Select(UserState.user)
  public user$!: Observable<User>;

  public readonly title: string = "Caballus";

  constructor(private readonly _router: Router,
              private readonly _platform: Platform) {
  }

  public ngOnInit(): void {
    if (Capacitor.isPluginAvailable("BranchDeepLinks") && this._platform.is("cordova")) {
      // BranchIo event listener
      BranchDeepLinks.addListener("init", (event: BranchInitEvent) => {
        // Retrieve deeplink keys from 'referringParams' and evaluate the values to determine where to route the user
        // Check '+clicked_branch_link' before deciding whether to use your Branch routing logic
        console.log("Branch init");

        // verify if the branch link is clicked
        if (event.referringParams["+clicked_branch_link"]) {
          // fetch url from branch link
          const urlToNavigate = event.referringParams.appendUrl || event.referringParams.custom_string;
          // navigate user to the clicked url
          this._router.navigateByUrl(urlToNavigate);
        }
      });

      // branch io error listener
      BranchDeepLinks.addListener("initError", (error: any) => {
        console.log("Branch initError", error);
      });

      document.addEventListener("deviceready", () => {
        /**
         * This event's listener will aid in determining whether or not
         * the background Initiation of the mode plugin failed
         */
        cordova.plugins.backgroundMode.on("failure", () => {
          console.log("backgroundMode", "failure");
        });
      }, false);
    }
  }
}
