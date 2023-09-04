export enum MediaSubjectType {
    CurrentRideImage = '[MediaSubjectType] currentRideImage',
    CurrentRideVideo = '[MediaSubjectType] currentRideVideo',
    ExistingRideImage = '[MediaSubjectType] existingRideImage',
    ExistingRideVideo = '[MediaSubjectType] existingRideVideo',
    HorseGalleryImage = '[MediaSubjectType] horseGalleryImage',
    HorseGalleryVideo = '[MediaSubjectType] horseGalleryVideo'
}

export namespace MediaSubjectType {
    export function toString(type: MediaSubjectType): string {
        switch (type) {
            case MediaSubjectType.CurrentRideImage:
            case MediaSubjectType.ExistingRideImage:
                return 'Ride Image';
            case MediaSubjectType.CurrentRideVideo:
            case MediaSubjectType.ExistingRideVideo:
                return 'Ride Video';
            case MediaSubjectType.HorseGalleryImage:
                return 'Horse Gallery Image';
            case MediaSubjectType.HorseGalleryVideo:
                return 'Horse Gallery Video';
            default:
                return '';
        }
    }

    export const members: MediaSubjectType[] = [
        MediaSubjectType.CurrentRideImage,
        MediaSubjectType.CurrentRideVideo,
        MediaSubjectType.ExistingRideImage,
        MediaSubjectType.ExistingRideVideo,
        MediaSubjectType.HorseGalleryImage,
        MediaSubjectType.HorseGalleryVideo,
    ];
}
