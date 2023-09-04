import { StringTermMultipleFilter } from '@rfx/common';

export class ConnectionGridFilters {
    public searchTerms: StringTermMultipleFilter = new StringTermMultipleFilter();

    constructor(params?: Partial<ConnectionGridFilters>) {
        if (!!params) {
            this.searchTerms = !!params.searchTerms
                ? new StringTermMultipleFilter(params.searchTerms)
                : this.searchTerms;
        }
    }
}
