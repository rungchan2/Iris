"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { YouTubeEmbed } from "@next/third-parties/google";

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string | null;
  title?: string;
}

export function YouTubeModal({ isOpen, onClose, videoId, title }: YouTubeModalProps) {
  if (!videoId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="aspect-video w-full">
          <YouTubeEmbed
            videoid={videoId}
            params="autoplay=1&rel=0"
            style="width: 100%; height: 100%;"
          />
        </div>
        {title && (
          <div className="p-4 bg-white">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}