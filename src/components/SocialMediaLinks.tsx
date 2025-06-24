
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface SocialMediaLinksProps {
  socialHandles: {
    twitter?: string;
    youtube?: string;
    facebook?: string;
    telegram?: string;
  };
}

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const SocialMediaLinks = ({ socialHandles }: SocialMediaLinksProps) => {
  const socialPlatforms = [
    {
      name: "X (Twitter)",
      key: "twitter" as const,
      icon: <TwitterIcon />,
      baseUrl: "https://twitter.com/",
      color: "hover:bg-black hover:text-white border-gray-300"
    },
    {
      name: "YouTube",
      key: "youtube" as const,
      icon: <YouTubeIcon />,
      baseUrl: "https://youtube.com/@",
      color: "hover:bg-red-600 hover:text-white border-gray-300"
    },
    {
      name: "Facebook",
      key: "facebook" as const,
      icon: <FacebookIcon />,
      baseUrl: "https://facebook.com/",
      color: "hover:bg-blue-600 hover:text-white border-gray-300"
    },
    {
      name: "Telegram",
      key: "telegram" as const,
      icon: <TelegramIcon />,
      baseUrl: "https://t.me/",
      color: "hover:bg-blue-500 hover:text-white border-gray-300"
    }
  ];

  const activePlatforms = socialPlatforms.filter(platform => socialHandles[platform.key]);

  if (activePlatforms.length === 0) return null;

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect with the Author</h3>
      <div className="flex flex-wrap gap-3">
        {activePlatforms.map((platform) => (
          <Button
            key={platform.key}
            variant="outline"
            size="sm"
            className={`transition-all duration-200 ${platform.color} flex items-center space-x-2`}
            asChild
          >
            <a
              href={`${platform.baseUrl}${socialHandles[platform.key]}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {platform.icon}
              <span className="hidden sm:inline">{platform.name}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SocialMediaLinks;
