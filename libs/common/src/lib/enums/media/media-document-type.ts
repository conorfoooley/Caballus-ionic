export enum MediaDocumentType {
    Image = '[MediaDocumentType] Image',
    Document = '[MediaDocumentType] Document',
    Video = '[MediaDocumentType] Video'
}

export namespace MediaDocumentType {
    export function toString(type: MediaDocumentType): string {
        switch (type) {
            case MediaDocumentType.Image:
                return 'Image';
            case MediaDocumentType.Document:
                return 'Document';
            case MediaDocumentType.Video:
                return 'Video';
            default:
                return '';
        }
    }

    export const members: MediaDocumentType[] = [
        MediaDocumentType.Image,
        MediaDocumentType.Document,
        MediaDocumentType.Video
    ];
}
