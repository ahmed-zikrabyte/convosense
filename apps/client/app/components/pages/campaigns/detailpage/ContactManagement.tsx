"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Download, Upload } from "lucide-react";

interface ContactManagementProps {
  isUploading: boolean;
  onDownloadTemplate: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ContactManagement({
  isUploading,
  onDownloadTemplate,
  onFileUpload,
}: ContactManagementProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Contact List Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
          <Button
            onClick={onDownloadTemplate}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Template</span>
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={onFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              id="csv-upload"
            />
            <Button
              variant="default"
              disabled={isUploading}
              className="flex items-center space-x-2 w-full"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? "Uploading..." : "Upload CSV"}</span>
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Upload a CSV file with phone numbers and dynamic variables for this campaign.</p>
          <p className="mt-1">Required format: phone number, dynamic variable1, dynamic variable2...</p>
        </div>
      </CardContent>
    </Card>
  );
}
