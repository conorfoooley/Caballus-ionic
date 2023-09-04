import { NotificationWithoutIds } from '@caballus/common';

export class Notification extends NotificationWithoutIds {
    public _id: string = '';

    constructor(params?: Partial<Notification>) {
        super(params);
        if (!!params) {
            this._id = params._id || this._id;
        }
    }
}
