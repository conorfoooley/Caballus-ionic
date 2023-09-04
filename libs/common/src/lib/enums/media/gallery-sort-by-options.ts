export enum GallerySortByOption {
    NewestToOldest = '[GallerySortByOption] newestToOldest',
    OldestToNewest = '[GallerySortByOption] oldestToNewest',
    Pinned = '[GallerySortByOption] pinned'
}

export namespace GallerySortByOption {
    export function toString(type: GallerySortByOption): string {
        switch (type) {
            case GallerySortByOption.NewestToOldest:
                return 'Newest To Oldest';
            case GallerySortByOption.OldestToNewest:
                return 'Oldest To Newest';
            case GallerySortByOption.Pinned:
                return 'Pinned';
            default:
                return '';
        }
    }

    export const members: GallerySortByOption[] = [
        GallerySortByOption.NewestToOldest,
        GallerySortByOption.OldestToNewest,
        GallerySortByOption.Pinned
    ];
}
