import { MediaUploadItem } from '@caballus/ui-common';
import { Receiver, EmitterAction } from '@ngxs-labs/emitter';
import { ImmutableContext } from '@ngxs-labs/immer-adapter';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { MediaUploadQueueService } from '../services';
import { Injectable } from '@angular/core';
import { AddItemToQueueAction, RemoveItemFromQueueAction, SetCurrentUploadingItemAction, UpdateItemInQueueAction } from './actions';
import { Observable, from } from 'rxjs';

interface IMediaUploadQueueState {
  mediaFileUploadQueue: MediaUploadItem[];
  currentUploadingItemInQueue: string;
}

@State<IMediaUploadQueueState>({
  name: 'mediaUploadQueue',
  defaults: {
    mediaFileUploadQueue: [],
    currentUploadingItemInQueue: '',
  },
})
@Injectable({ providedIn: 'root' })
export class MediaUploadQueueState {

  constructor(
    private readonly _mediaUploadQueueService: MediaUploadQueueService,
  ) {}

  @Selector()
  public static queuedMedias(state: IMediaUploadQueueState): MediaUploadItem[] {
    return state.mediaFileUploadQueue;
  }

  @Selector()
  public static currentUploadingItemInQueue(
    state: IMediaUploadQueueState
  ): MediaUploadItem | undefined {
    return state.mediaFileUploadQueue.find(f => f.mediaId === state.currentUploadingItemInQueue);
  }

  @Receiver()
  @ImmutableContext()
  public static rehydrateMediaUploadQueue(
    { setState }: StateContext<IMediaUploadQueueState>,
    { payload }: EmitterAction<MediaUploadItem[]>
  ): void {
    setState((state: IMediaUploadQueueState) => {
      state.mediaFileUploadQueue = payload;
      return state;
    });
  }

  @Action(SetCurrentUploadingItemAction)
  @ImmutableContext()
  public setCurrentUploadingItemInQueue(
    { setState }: StateContext<IMediaUploadQueueState>,
    action: SetCurrentUploadingItemAction
  ): void {
    setState((state: IMediaUploadQueueState) => {
      state.currentUploadingItemInQueue = action.itemId;
      return state;
    });
  }

  @Action(AddItemToQueueAction)
  @ImmutableContext()
  public addItemToMediaQueue(
    { setState, getState }: StateContext<IMediaUploadQueueState>,
    action: AddItemToQueueAction
  ): Observable<void> {
    const mediaFileUploadQueue = [...getState().mediaFileUploadQueue, action.item];

    setState((state: IMediaUploadQueueState) => {
      state.mediaFileUploadQueue = mediaFileUploadQueue;
      return state;
    });

    return from(this._mediaUploadQueueService.updateQueue(mediaFileUploadQueue));
  }

  @Action(UpdateItemInQueueAction)
  @ImmutableContext()
  public updateItemInMediaQueue(
    { setState, getState }: StateContext<IMediaUploadQueueState>,
    action: UpdateItemInQueueAction
  ): Observable<void> {
    const mediaFileUploadQueue = getState().mediaFileUploadQueue.map((item) => {
      if (item.mediaId === action.item.mediaId) {
        return {
          ...item,
          ...action.item,
        };
      }
      return item;
    });
    setState((state: IMediaUploadQueueState) => {
      state.mediaFileUploadQueue = mediaFileUploadQueue;
      return state;
    });

    return from(this._mediaUploadQueueService.updateQueue(mediaFileUploadQueue));
  }

  @Action(RemoveItemFromQueueAction)
  @ImmutableContext()
  public async removeItemFromMediaQueue(
    { setState, getState }: StateContext<IMediaUploadQueueState>,
   action: RemoveItemFromQueueAction
  ): Promise<void> {
    const mediaFileUploadQueue = getState().mediaFileUploadQueue.filter(
      (item) => item.mediaId !== action.itemId
    );
    setState((state: IMediaUploadQueueState) => {
      state.mediaFileUploadQueue = mediaFileUploadQueue;
      return state;
    });

    return this._mediaUploadQueueService.updateQueue(mediaFileUploadQueue);
  }
}
