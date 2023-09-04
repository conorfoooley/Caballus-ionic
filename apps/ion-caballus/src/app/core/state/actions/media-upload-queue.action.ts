import { MediaUploadItem } from "@caballus/ui-common";

enum MediaUploadQueueAction {
  AddItemToQueue = '[MediaUploadQueueAction] addItemToQueue',
  RemoveItemFromQueue = '[MediaUploadQueueAction] removeItemFromQueue',
  ClearQueue = '[MediaUploadQueueAction] clearQueue',
  SetCurrentUploadingItem = '[MediaUploadQueueAction] setCurrentUploadingItem',
  UpdateItemInQueue = '[MediaUploadQueueAction] uploadItemQueue',
}

export class AddItemToQueueAction {
  public static readonly type: MediaUploadQueueAction = MediaUploadQueueAction.AddItemToQueue;
  constructor(public item: MediaUploadItem) {}
}

export class RemoveItemFromQueueAction {
  public static readonly type: MediaUploadQueueAction = MediaUploadQueueAction.RemoveItemFromQueue;
  constructor(public itemId: string) {}
}

export class ClearQueueAction {
  public static readonly type: MediaUploadQueueAction = MediaUploadQueueAction.ClearQueue;
}

export class SetCurrentUploadingItemAction {
  public static readonly type: MediaUploadQueueAction = MediaUploadQueueAction.SetCurrentUploadingItem;
  constructor(public itemId: string) {}
}

export class UpdateItemInQueueAction {
  public static readonly type: MediaUploadQueueAction = MediaUploadQueueAction.UpdateItemInQueue;
  constructor(public item: Partial<MediaUploadItem>) {}
}
