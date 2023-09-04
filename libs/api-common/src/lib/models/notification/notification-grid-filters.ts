import { DateRangeFilter } from '@rfx/common';

export class NotificationGridFilters {
    public createdDate: DateRangeFilter = new DateRangeFilter();

    constructor(params?: Partial<NotificationGridFilters>) {
        if (!!params) {
            this.createdDate = !!params.createdDate
                ? new DateRangeFilter(params.createdDate)
                : this.createdDate;
        }
    }
}
