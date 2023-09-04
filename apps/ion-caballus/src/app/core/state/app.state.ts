import { Selector, State, StateContext } from "@ngxs/store";
import { EmitterAction, Receiver } from "@ngxs-labs/emitter";
import { ImmutableContext } from "@ngxs-labs/immer-adapter";
import { Injectable } from "@angular/core";

interface IAppState {
  refreshNotifications: boolean;
}

@State<IAppState>({
  name: "app",
  defaults: {
    refreshNotifications: false
  }
})
@Injectable()
export class AppState {
  @Selector()
  public static needToRefreshNotifications(state: IAppState): boolean {
    return state.refreshNotifications;
  }

  @Receiver()
  @ImmutableContext()
  public static refreshNotifications(
    { setState }: StateContext<IAppState>,
    { payload }: EmitterAction<boolean>
  ): void {
    setState((state: IAppState) => {
      state.refreshNotifications = payload;
      return state;
    });
  }
}
