"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";
import { RefreshCw, Save, X } from "lucide-react";

interface EditPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => Promise<void>;
  currentPrompt: string;
  llmId: string;
}

export function EditPromptModal({
  isOpen,
  onClose,
  onSubmit,
  currentPrompt,
  llmId,
}: EditPromptModalProps) {
  const [prompt, setPrompt] = useState(currentPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setPrompt(currentPrompt);
    setHasChanges(false);
    setError("");
  }, [currentPrompt, isOpen]);

  useEffect(() => {
    setHasChanges(prompt !== currentPrompt);
  }, [prompt, currentPrompt]);

  const handleSubmit = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    if (!prompt.trim()) {
      setError("Prompt cannot be empty");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onSubmit(prompt);
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update prompt");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges && !loading) {
      if (confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const resetToOriginal = () => {
    setPrompt(currentPrompt);
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit LLM Prompt</DialogTitle>
          <DialogDescription>
            Update the general prompt for LLM: <code className="bg-muted px-1 py-0.5 rounded">{llmId}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">General Prompt</Label>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{prompt.length} characters</span>
                {hasChanges && (
                  <>
                    <span>•</span>
                    <span className="text-amber-600">Unsaved changes</span>
                  </>
                )}
              </div>
            </div>
            <div className="h-96 border rounded-md overflow-hidden">
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-full resize-none border-0 focus-visible:ring-0 font-mono text-sm"
                placeholder="Enter the general prompt for this LLM..."
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="bg-muted/50 p-3 rounded-md">
            <h4 className="text-sm font-medium mb-2">Prompt Guidelines:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Be specific and clear about the AI's role and behavior</li>
              <li>• Include any necessary context or instructions</li>
              <li>• Use [WAIT FOR USER RESPONSE] to control conversation flow</li>
              <li>• End with [END CALL] if the conversation should terminate</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              {hasChanges && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToOriginal}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !hasChanges}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {hasChanges ? "Save Changes" : "No Changes"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}