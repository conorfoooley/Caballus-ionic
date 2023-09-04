import { Plugin, registerPlugin } from '@capacitor/core';
import { MediaUploadItem } from '@caballus/ui-common';

export interface FileSelectorPluginPluginInterface extends Plugin {
  ReadFile: ({
    filePath,
  }: {
    filePath: string;
  }) => Promise<Record<'base64', string>>;
  ReadVideoFile: ({ filePath }: { filePath: string }) => Promise<{
    base64: string;
    thumbnail: string;
  }>;
  MoveVideoFileToPermanentLocation: ({
    filePath,
  }: {
    filePath: string;
  }) => Promise<Record<'newPath', string>>;
  GeneRateThumbnail: ({ filePath }: { filePath: string }) => Promise<{
    thumbnail: string;
    fileSize: number;
  }>;
  UploadVideoFile: ({
    filePath,
    uploadLink,
    lastUploadedPart,
  }: {
    filePath: string;
    uploadLink: string;
    mediaId: string;
    start: number;
    end: number;
    fileSize: number;
    lastUploadedPart: number;
  }) => Promise<Partial<MediaUploadItem>>;
  RemoveVideoFile: ({
    filePath,
  }: {
    filePath: string;
  }) => Promise<Record<'message', string>>;
}

export const FileSelectorPlugin =
  registerPlugin<FileSelectorPluginPluginInterface>('FileSelectorPlugin');
