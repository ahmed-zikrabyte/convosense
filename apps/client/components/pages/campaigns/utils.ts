import { KnowledgeFile, KnowledgeText, KnowledgeUrl } from "./types";

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const prepareKnowledgeBaseForSubmit = (
  files: KnowledgeFile[],
  texts: KnowledgeText[],
  urls: KnowledgeUrl[]
) => {
  return [
    // Existing files (keep as-is for edit mode)
    ...files
      .filter(file => !file.isNew)
      .map(file => ({
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        uploadedAt: file.uploadedAt || new Date().toISOString(),
        fileUrl: file.fileUrl,
      })),
    // New files (in a real implementation, you would upload these first)
    ...files
      .filter(file => file.isNew)
      .map(file => ({
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        uploadedAt: new Date().toISOString(),
        fileUrl: `uploads/${file.fileName}`, // Placeholder
      })),
    // Text knowledge
    ...texts.map(text => ({
      fileName: `${text.title || 'untitled'}.txt`,
      fileType: 'text/plain',
      fileSize: text.content.length,
      uploadedAt: new Date().toISOString(),
    })),
    // URL knowledge
    ...urls.map(url => ({
      fileName: `${url.title || 'untitled'}.url`,
      fileType: 'text/url',
      fileSize: url.url.length,
      uploadedAt: new Date().toISOString(),
      fileUrl: url.url,
    })),
  ];
};