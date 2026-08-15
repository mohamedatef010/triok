/**
 * SocialIcons — Real brand SVG icons for all supported social platforms.
 * Used across Home page, Navbar, and any future component.
 *
 * Platforms:
 *   Existing:  Telegram, WhatsApp, Instagram, VK, Mail
 *   New:       YouTube, RuTube, Дзен (Dzen), Boosty, Профи.ру, Gorko.ru
 */

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

/* ─── Existing platforms ───────────────────────────────────────── */

export function TelegramIcon({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

export function WhatsAppIcon({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

export function InstagramIcon({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  );
}

export function VKIcon({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.847 2.456 2.271 4.607 2.862 4.607.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.168-3.608 2.168-3.608.119-.254.322-.491.762-.491h1.744c.525 0 .643.271.525.643-.22 1.017-2.355 4.031-2.355 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.491-.085.745-.576.745z"/>
    </svg>
  );
}

export function MailIcon({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

/* ─── New platforms ────────────────────────────────────────────── */

export function YouTubeIcon({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export function RuTubeIcon({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.5 16.5H13v-4h-2v4H8.5v-9H11v3h2v-3h2.5v9z"/>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3 13.5h-2v-3.5h-2v3.5H9V8.5h2V12h2V8.5h2v7z" opacity="0"/>
      {/* RuTube stylized "RT" in circle */}
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="0" opacity="0"/>
      <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor" fontFamily="sans-serif">RT</text>
    </svg>
  );
}

// Better RuTube icon - custom stylized
export function RuTubeIconV2({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="currentColor" fillOpacity="0.15"/>
      <path d="M8 14h10c3.3 0 6 2.7 6 6s-2.7 6-6 6H8V14z" fill="currentColor"/>
      <path d="M18 20l6 6h-4l-4-5.5V26h-2V14h2v5.5l4-5.5h4l-6 6z" fill="none"/>
      <text x="7" y="26" fontSize="13" fontWeight="900" fill="currentColor" fontFamily="system-ui,sans-serif" letterSpacing="-0.5">RT</text>
      <path d="M26 14h6v3h-3v9h-3V14z" fill="currentColor" opacity="0.7"/>
    </svg>
  );
}

export function DzenIcon({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.5 19.5c-3.314 0-6-2.686-6-6 0-1.2.354-2.318.963-3.257L12 14.5l2.037-.507C14.647 14.982 15 16.1 15 17.3c0 1.2-.354 1.7-.5 1.7-.146 0-.5.5-.5.5zm4.5-4.5l-4 1-4-1c-.5-2.5 1.5-4.5 4-4.5s4.5 2 4 4.5zM12 9.5a2.5 2.5 0 0 1-2.5-2.5c0-1.2.8-2.2 1.9-2.4C11.6 4.5 11.8 4.5 12 4.5c1.38 0 2.5 1.12 2.5 2.5S13.38 9.5 12 9.5z" opacity="0.1"/>
      {/* Stylized Dzen "D" */}
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM7 9h5c1.657 0 3 1.343 3 3s-1.343 3-3 3H7V9zm3 5h2c.552 0 1-.448 1-1s-.448-1-1-1h-2v2zm5 1h-2v2h-3v-2H7v-2h8v2z" opacity="0"/>
      {/* Clean Dzen logo approximation */}
      <g>
        <path d="M12 2.25C6.615 2.25 2.25 6.615 2.25 12S6.615 21.75 12 21.75 21.75 17.385 21.75 12 17.385 2.25 12 2.25zM8 8.5h5.5A3.5 3.5 0 0 1 17 12a3.5 3.5 0 0 1-3.5 3.5H8v-7zm2 5.5h3.5a1.5 1.5 0 0 0 0-3H10v3z"/>
      </g>
    </svg>
  );
}

// Clean simple Dzen icon (the actual Dzen logo style)
export function DzenIconClean({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      {/* Dzen stylized "Д" */}
      <path d="M21.5 12c0 5.247-4.253 9.5-9.5 9.5S2.5 17.247 2.5 12 6.753 2.5 12 2.5s9.5 4.253 9.5 9.5z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d="M7.5 8.5h5a3 3 0 0 1 0 6H9v1.5H7.5V8.5zm2 4.5h3a1 1 0 0 0 0-2H9.5v2zM13 15h2v1.5h-2V15z" fill="currentColor"/>
    </svg>
  );
}

export function BoostyIcon({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      {/* Boosty lightning bolt style logo */}
      <path d="M13.5 2L6 13.5h6L9 22l9-11.5h-6L13.5 2z"/>
    </svg>
  );
}

export function ProfiRuIcon({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      {/* Profi.ru styled "P" with checkmark */}
      <circle cx="12" cy="12" r="9.5" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8.5 7h4.5a2.5 2.5 0 0 1 0 5H10v5H8.5V7zm2 4h2.5a.5.5 0 0 0 0-1H10.5v1z" fill="currentColor"/>
      <path d="M14.5 14l1.5 1.5L18 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function GorkoIcon({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      {/* Gorko.ru — wedding rings style logo */}
      <circle cx="9" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="15" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 8.5c0 0 1-1.5 0-2.5s-2.5-.5-2.5 1S11 10 12 10s3.5-2 3.5-3-1.5-1.5-2.5-1-1 2.5-1 2.5" fill="currentColor" fillOpacity="0.4" stroke="none"/>
    </svg>
  );
}

/* ─── Platform config table ────────────────────────────────────── */

export interface SocialPlatform {
  key: string;
  label: string;
  placeholder: string;
  Icon: React.FC<IconProps>;
  color: string;         // text color class
  bg: string;            // background class
  border: string;        // border class
  hoverBg: string;
  hoverBorder: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "telegram",
    label: "Telegram",
    placeholder: "https://t.me/username",
    Icon: TelegramIcon,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    hoverBg: "hover:bg-sky-500/20",
    hoverBorder: "hover:border-sky-500/40",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    placeholder: "https://wa.me/1234567890",
    Icon: WhatsAppIcon,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    hoverBg: "hover:bg-green-500/20",
    hoverBorder: "hover:border-green-500/40",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/username",
    Icon: InstagramIcon,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    hoverBg: "hover:bg-pink-500/20",
    hoverBorder: "hover:border-pink-500/40",
  },
  {
    key: "vk",
    label: "ВКонтакте",
    placeholder: "https://vk.com/username",
    Icon: VKIcon,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    hoverBg: "hover:bg-blue-500/20",
    hoverBorder: "hover:border-blue-500/40",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@channel",
    Icon: YouTubeIcon,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    hoverBg: "hover:bg-red-500/20",
    hoverBorder: "hover:border-red-500/40",
  },
  {
    key: "rutube",
    label: "RuTube",
    placeholder: "https://rutube.ru/channel/...",
    Icon: RuTubeIconV2,
    color: "text-blue-300",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    hoverBg: "hover:bg-blue-400/20",
    hoverBorder: "hover:border-blue-400/40",
  },
  {
    key: "dzen",
    label: "Дзен",
    placeholder: "https://dzen.ru/username",
    Icon: DzenIconClean,
    color: "text-orange-300",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
    hoverBg: "hover:bg-orange-400/20",
    hoverBorder: "hover:border-orange-400/40",
  },
  {
    key: "boosty",
    label: "Boosty",
    placeholder: "https://boosty.to/username",
    Icon: BoostyIcon,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    hoverBg: "hover:bg-amber-500/20",
    hoverBorder: "hover:border-amber-500/40",
  },
  {
    key: "profi",
    label: "Профи.ру",
    placeholder: "https://profi.ru/profile/...",
    Icon: ProfiRuIcon,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    hoverBg: "hover:bg-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/40",
  },
  {
    key: "gorko",
    label: "Gorko.ru",
    placeholder: "https://gorko.ru/...",
    Icon: GorkoIcon,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    hoverBg: "hover:bg-rose-500/20",
    hoverBorder: "hover:border-rose-500/40",
  },
  {
    key: "mailru",
    label: "Email / Mail.ru",
    placeholder: "example@mail.ru или mailto:...",
    Icon: MailIcon,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    hoverBg: "hover:bg-violet-500/20",
    hoverBorder: "hover:border-violet-500/40",
  },
];

/** Safely open a social link — handles missing protocol + mailto detection */
export function openSocialLink(raw: string, key: string) {
  if (!raw) return;
  let url = raw.trim();
  if (key === "mailru") {
    if (!url.startsWith("mailto:") && url.includes("@")) url = `mailto:${url}`;
    else if (!url.startsWith("mailto:") && !url.startsWith("http")) url = `https://${url}`;
  } else {
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
