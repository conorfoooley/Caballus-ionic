export const bytesToSize = (bytes: number): string => {
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 bytes';
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1
  );
  if (i === 0) return `${bytes} ${sizes[i]}`;
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
};

export const base64Size = (base64Str: string): number => {
  const stringLength = base64Str.length - 'data:image/png;base64,'.length;
  return 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
};
