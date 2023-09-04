export const base64ToDataUrl = (base64String: string, format: string = 'jpg'): string => `data:image/${format};base64,${base64String}`;
