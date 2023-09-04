export interface Video {
    /**
     * Gets the video contents as a Blob instance.
     *
     * @returns the encoded video contents as if (or would be) read directly off
     * of the disk in a blob form.
     */
    blob(): Promise<Blob>;
}
