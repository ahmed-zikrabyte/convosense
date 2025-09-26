"use client";

import React from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Upload,
  FileText,
  Link as LinkIcon,
  X,
  Plus,
} from "lucide-react";
import { KnowledgeFile, KnowledgeText, KnowledgeUrl } from "./types";
import { formatFileSize, generateId } from "./utils";
import { ACCEPTED_FILE_TYPES } from "./constants";

interface KnowledgeBaseFormProps {
  files: KnowledgeFile[];
  texts: KnowledgeText[];
  urls: KnowledgeUrl[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onFileUpload: (files: FileList) => void;
  onFileRemove: (id: string) => void;
  onTextAdd: () => void;
  onTextUpdate: (id: string, field: keyof KnowledgeText, value: string) => void;
  onTextRemove: (id: string) => void;
  onUrlAdd: () => void;
  onUrlUpdate: (id: string, field: keyof KnowledgeUrl, value: string) => void;
  onUrlRemove: (id: string) => void;
}

export function KnowledgeBaseForm({
  files,
  texts,
  urls,
  activeTab,
  onTabChange,
  onFileUpload,
  onFileRemove,
  onTextAdd,
  onTextUpdate,
  onTextRemove,
  onUrlAdd,
  onUrlUpdate,
  onUrlRemove,
}: KnowledgeBaseFormProps) {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      onFileUpload(fileList);
      event.target.value = ""; // Reset input
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Knowledge Base</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Upload files, add text, or provide URLs to train your AI agent with
          additional context.
        </p>

        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="urls">URLs</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                multiple
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium">Upload Files</p>
                <p className="text-xs text-muted-foreground">
                  PDF, TXT, DOC, DOCX, CSV, JSON (Max 10MB each)
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">{file.fileName}</p>
                          {file.isNew && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)} • {file.fileType}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onFileRemove(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <Button
              onClick={onTextAdd}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Text Knowledge
            </Button>

            {texts.map((text) => (
              <Card key={text.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder="Knowledge title"
                      value={text.title}
                      onChange={(e) =>
                        onTextUpdate(text.id, "title", e.target.value)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onTextRemove(text.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter knowledge content..."
                    value={text.content}
                    onChange={(e) =>
                      onTextUpdate(text.id, "content", e.target.value)
                    }
                    rows={4}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="urls" className="space-y-4">
            <Button
              onClick={onUrlAdd}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add URL Knowledge
            </Button>

            {urls.map((urlItem) => (
              <Card key={urlItem.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        placeholder="Knowledge title"
                        value={urlItem.title}
                        onChange={(e) =>
                          onUrlUpdate(urlItem.id, "title", e.target.value)
                        }
                        className="flex-1 mr-2"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onUrlRemove(urlItem.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="https://example.com"
                        value={urlItem.url}
                        onChange={(e) =>
                          onUrlUpdate(urlItem.id, "url", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}