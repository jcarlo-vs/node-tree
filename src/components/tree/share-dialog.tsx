"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon, CopyIcon } from "lucide-react";

type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  editToken: string;
};

export function ShareDialog({
  open,
  onOpenChange,
  slug,
  editToken,
}: ShareDialogProps) {
  const [copiedView, setCopiedView] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const viewUrl = `${baseUrl}/tree/${slug}`;
  const editUrl = `${baseUrl}/tree/${slug}?token=${editToken}`;

  function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Family Tree</DialogTitle>
          <DialogDescription>
            Share the view-only link with anyone. Use the edit link to let others
            make changes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>View-only Link</Label>
            <div className="flex gap-2">
              <Input value={viewUrl} readOnly className="text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(viewUrl, setCopiedView)}
              >
                {copiedView ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Edit Link (anyone with this can edit)</Label>
            <div className="flex gap-2">
              <Input value={editUrl} readOnly className="text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(editUrl, setCopiedEdit)}
              >
                {copiedEdit ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
