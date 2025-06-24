
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

const YouTubeModal = ({ isOpen, onClose, videoUrl, title }: YouTubeModalProps) => {
  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match?.[1];
  };

  const videoId = getVideoId(videoUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title || "Video"}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(videoUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in YouTube
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title || "YouTube video"}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            allowFullScreen
            allow="autoplay; encrypted-media"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default YouTubeModal;
