/**
 * Determines whether the file ends within the next chunk and returns
 * either the end of the file or end of chunk based on the starting byte.
 * @param start starting byte of chunk
 * @param chunkSize
 * @param fileSize
 */
export const getChunkEnd = (start, chunkSize: number, fileSize: number): number => {
    if (start + chunkSize > fileSize) {
        return fileSize;
    } else {
        return start + chunkSize;
    }
};
