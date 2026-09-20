import { useState } from "react";
import { Share2, X, Copy, Check, Twitter, Facebook, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface ShareData {
  title: string;
  text: string;
  hashtags?: string[];
  url?: string;
}

interface ShareProgressProps {
  data: ShareData;
  variant?: "default" | "outline" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const ShareProgress = ({
  data,
  variant = "default",
  size = "default",
  className = "",
}: ShareProgressProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Use the current URL if not specified
  const shareUrl = data.url || window.location.href;

  // Format the share text with hashtags
  const getShareText = (includeTags = true) => {
    let text = data.text;
    if (includeTags && data.hashtags && data.hashtags.length > 0) {
      text += " " + data.hashtags.map(tag => `#${tag}`).join(" ");
    }
    return text;
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "Share text has been copied to your clipboard.",
        });
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({
          variant: "destructive",
          title: "Copy failed",
          description: "Could not copy to clipboard. Please try again.",
        });
      }
    );
  };

  // Handle native sharing
  const handleNativeShare = () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator && navigator.share) {
      navigator.share({
        title: data.title,
        text: getShareText(false),
        url: shareUrl,
      })
        .then(() => {
          toast({
            title: "Shared successfully",
            description: "Your progress has been shared.",
          });
          setOpen(false);
        })
        .catch((error) => {
          console.error("Error sharing:", error);
        });
    } else {
      toast({
        variant: "destructive",
        title: "Sharing not supported",
        description: "Web Share API is not supported in your browser.",
      });
    }
  };

  // Share URLs for different platforms
  const getTwitterShareUrl = () => {
    const text = encodeURIComponent(getShareText(true));
    const url = encodeURIComponent(shareUrl);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  };

  const getFacebookShareUrl = () => {
    const url = encodeURIComponent(shareUrl);
    return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  };

  const getLinkedInShareUrl = () => {
    const title = encodeURIComponent(data.title);
    const text = encodeURIComponent(getShareText(false));
    const url = encodeURIComponent(shareUrl);
    return `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${text}`;
  };

  const getEmailShareUrl = () => {
    const subject = encodeURIComponent(data.title);
    const body = encodeURIComponent(`${getShareText(true)}\n\n${shareUrl}`);
    return `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className={className}
            aria-label="Share progress"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant={variant}
            size={size}
            className={`gap-2 ${className}`}
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your progress</DialogTitle>
          <DialogDescription>
            Share your financial journey with others to inspire them.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="social" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="link">Copy Link</TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="mt-4 space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => window.open(getTwitterShareUrl(), "_blank")}
              >
                <Twitter className="h-5 w-5 text-blue-400" />
                <span className="text-xs">Twitter</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => window.open(getFacebookShareUrl(), "_blank")}
              >
                <Facebook className="h-5 w-5 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => window.open(getLinkedInShareUrl(), "_blank")}
              >
                <Linkedin className="h-5 w-5 text-blue-700" />
                <span className="text-xs">LinkedIn</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => window.open(getEmailShareUrl(), "_blank")}
              >
                <Mail className="h-5 w-5 text-gray-500" />
                <span className="text-xs">Email</span>
              </Button>
            </div>

            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium mb-1">Share text:</p>
              <p className="text-sm text-muted-foreground break-words">
                {getShareText()}
              </p>
            </div>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                className="w-full gap-2"
                onClick={handleNativeShare}
              >
                <Share2 className="h-4 w-4" />
                Share directly
              </Button>
            )}
          </TabsContent>

          <TabsContent value="link" className="mt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Input
                  id="link"
                  readOnly
                  value={shareUrl}
                  className="h-9"
                />
              </div>
              <Button
                size="sm"
                className="px-3 h-9"
                onClick={() => copyToClipboard(shareUrl)}
              >
                <span className="sr-only">Copy</span>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium mb-1">Share message:</p>
              <p className="text-sm text-muted-foreground break-words">{getShareText()}</p>
              <Button
                variant="link"
                size="sm"
                className="px-0 h-auto mt-1"
                onClick={() => copyToClipboard(getShareText())}
              >
                Copy message
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
          <div className="ml-auto text-xs text-muted-foreground">
            #savyfunds
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProgress;