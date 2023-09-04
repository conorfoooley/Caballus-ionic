import { GridParams, GridParamsModel } from '@rfx/common';
import { NotificationGridFilters } from './notification-grid-filters';

export class NotificationGridParams {
    public grid: GridParams;
    public filters: NotificationGridFilters;

    constructor(gridParams?: Partial<GridParamsModel>, filterParams?: NotificationGridFilters) {
        this.grid = new GridParams(gridParams);
        this.filters = new NotificationGridFilters(filterParams);
    }
}
