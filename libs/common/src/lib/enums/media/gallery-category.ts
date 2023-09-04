export enum GalleryCategory {
    General = '[GalleryCategory] general',
    Pinned = '[GalleryCategory] pinned'
}

export namespace GalleryCategory {
    export function toString(type: GalleryCategory): string {
        switch (type) {
            case GalleryCategory.General:
                return 'General';
            case GalleryCategory.Pinned:
                return 'Pinned';
            default:
                return '';
        }
    }

    export const members: GalleryCategory[] = [
        GalleryCategory.General,
        GalleryCategory.Pinned
    ];
}
