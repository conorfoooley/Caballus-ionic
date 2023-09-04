import { GridParams, GridParamsModel } from '@rfx/common';
import { ConnectionGridFilters } from './connection-grid-filters';

export class ConnectionGridParams {
    public grid: GridParams;
    public filters: ConnectionGridFilters;

    constructor(gridParams?: Partial<GridParamsModel>, filterParams?: ConnectionGridFilters) {
        this.grid = new GridParams(gridParams);
        this.filters = new ConnectionGridFilters(filterParams);
    }
}
