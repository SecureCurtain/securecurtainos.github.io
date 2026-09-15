// jb7572_2026-08-25: Multi-Theme Desktop Icon Graphics Engine
// Supports Sweet Gradient Candy-Icons, Vector Icons, Image Files (.png, .svg, .ico, data URLs, file paths), Dynamic Sizing & Auto Theme-Matching

import React from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { 
  Zap, 
  Activity, 
  Binary, 
  HardDrive, 
  ShieldCheck, 
  Settings, 
  Cpu, 
  Package, 
  Search, 
  Terminal, 
  FolderTree, 
  Folder, 
  FileText, 
  Palette, 
  BookOpen, 
  Info, 
  Layers, 
  HelpCircle,
  Disc,
  HeartPulse,
  Sparkles,
  Globe,
  Compass,
  Code,
  Flame,
  Wrench,
  FileCode,
  Monitor,
  Radio,
  Lock,
  Wifi,
  LayoutGrid,
  Laptop,
  Users,
  Server,
  Fingerprint,
  FolderGit2
} from 'lucide-react';

interface IconRendererProps {
  iconName: string;
  className?: string;
  size?: number;
  highlight?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Zap,
  Activity,
  Binary,
  HardDrive,
  ShieldCheck,
  Settings,
  Cpu,
  Package,
  FolderGit2,
  Search,
  Terminal,
  FolderTree,
  Folder,
  FileText,
  Palette,
  BookOpen,
  Info,
  Layers,
  HelpCircle,
  Disc,
  HeartPulse,
  Sparkles,
  Globe,
  Compass,
  Code,
  Flame,
  Wrench,
  FileCode,
  Monitor,
  Radio,
  Lock,
  Wifi,
  LayoutGrid,
  Laptop,
  Users,
  Server,
  Fingerprint
};

// Candy-Icons Sweet Multi-Hue Gradient Palette Map
const CANDY_GRADIENTS: Record<string, { bg: string; shadow: string; glow: string }> = {
  Fingerprint: {
    bg: 'from-[#f59e0b] via-[#ea580c] to-[#dc2626]',
    shadow: 'shadow-[0_6px_16px_rgba(245,158,11,0.45)]',
    glow: 'rgba(245,158,11,0.6)'
  },
  Users: {
    bg: 'from-[#8338ec] via-[#3a86ff] to-[#00f5d4]',
    shadow: 'shadow-[0_6px_16px_rgba(131,56,236,0.45)]',
    glow: 'rgba(131,56,236,0.6)'
  },
  Server: {
    bg: 'from-[#06d6a0] via-[#118ab2] to-[#073b4c]',
    shadow: 'shadow-[0_6px_16px_rgba(6,214,160,0.45)]',
    glow: 'rgba(6,214,160,0.6)'
  },
  Laptop: {
    bg: 'from-[#4361ee] via-[#3a0ca3] to-[#7209b7]',
    shadow: 'shadow-[0_6px_16px_rgba(67,97,238,0.45)]',
    glow: 'rgba(67,97,238,0.6)'
  },
  Terminal: {
    bg: 'from-[#f72585] via-[#7209b7] to-[#3a0ca3]',
    shadow: 'shadow-[0_6px_16px_rgba(247,37,133,0.45)]',
    glow: 'rgba(247,37,133,0.6)'
  },
  Folder: {
    bg: 'from-[#4cc9f0] via-[#4895ef] to-[#4361ee]',
    shadow: 'shadow-[0_6px_16px_rgba(76,201,240,0.45)]',
    glow: 'rgba(76,201,240,0.6)'
  },
  FolderTree: {
    bg: 'from-[#4cc9f0] via-[#4895ef] to-[#3f37c9]',
    shadow: 'shadow-[0_6px_16px_rgba(76,201,240,0.45)]',
    glow: 'rgba(76,201,240,0.6)'
  },
  Settings: {
    bg: 'from-[#ff0844] via-[#ff6a00] to-[#ffb703]',
    shadow: 'shadow-[0_6px_16px_rgba(255,106,0,0.45)]',
    glow: 'rgba(255,106,0,0.6)'
  },
  Wrench: {
    bg: 'from-[#ff0844] via-[#f72585] to-[#b5179e]',
    shadow: 'shadow-[0_6px_16px_rgba(255,8,68,0.45)]',
    glow: 'rgba(255,8,68,0.6)'
  },
  ShieldCheck: {
    bg: 'from-[#06d6a0] via-[#05c46b] to-[#118ab2]',
    shadow: 'shadow-[0_6px_16px_rgba(6,214,160,0.45)]',
    glow: 'rgba(6,214,160,0.6)'
  },
  Lock: {
    bg: 'from-[#00f5d4] via-[#00bbf9] to-[#0077b6]',
    shadow: 'shadow-[0_6px_16px_rgba(0,245,212,0.45)]',
    glow: 'rgba(0,245,212,0.6)'
  },
  Wifi: {
    bg: 'from-[#06d6a0] via-[#118ab2] to-[#073b4c]',
    shadow: 'shadow-[0_6px_16px_rgba(6,214,160,0.45)]',
    glow: 'rgba(6,214,160,0.6)'
  },
  Zap: {
    bg: 'from-[#ff007f] via-[#ff5400] to-[#ffbd00]',
    shadow: 'shadow-[0_6px_16px_rgba(255,0,127,0.45)]',
    glow: 'rgba(255,0,127,0.6)'
  },
  Sparkles: {
    bg: 'from-[#ff007f] via-[#7928ca] to-[#00dfd8]',
    shadow: 'shadow-[0_6px_16px_rgba(121,40,202,0.45)]',
    glow: 'rgba(121,40,202,0.6)'
  },
  HeartPulse: {
    bg: 'from-[#ff416c] via-[#ff4b2b] to-[#ff007f]',
    shadow: 'shadow-[0_6px_16px_rgba(255,65,108,0.45)]',
    glow: 'rgba(255,65,108,0.6)'
  },
  Activity: {
    bg: 'from-[#ffee32] via-[#ffd100] to-[#f3722c]',
    shadow: 'shadow-[0_6px_16px_rgba(243,114,44,0.45)]',
    glow: 'rgba(243,114,44,0.6)'
  },
  Cpu: {
    bg: 'from-[#f9844a] via-[#f8961e] to-[#f3722c]',
    shadow: 'shadow-[0_6px_16px_rgba(248,150,30,0.45)]',
    glow: 'rgba(248,150,30,0.6)'
  },
  Palette: {
    bg: 'from-[#ff0080] via-[#7928ca] to-[#00dfd8]',
    shadow: 'shadow-[0_6px_16px_rgba(255,0,128,0.45)]',
    glow: 'rgba(255,0,128,0.6)'
  },
  Code: {
    bg: 'from-[#b224ef] via-[#7579ff] to-[#4361ee]',
    shadow: 'shadow-[0_6px_16px_rgba(178,36,239,0.45)]',
    glow: 'rgba(178,36,239,0.6)'
  },
  FileCode: {
    bg: 'from-[#8338ec] via-[#3a86ff] to-[#00f5d4]',
    shadow: 'shadow-[0_6px_16px_rgba(131,56,236,0.45)]',
    glow: 'rgba(131,56,236,0.6)'
  },
  Package: {
    bg: 'from-[#3a86ff] via-[#8338ec] to-[#ff006e]',
    shadow: 'shadow-[0_6px_16px_rgba(58,134,255,0.45)]',
    glow: 'rgba(58,134,255,0.6)'
  },
  HardDrive: {
    bg: 'from-[#00b4d8] via-[#0077b6] to-[#03045e]',
    shadow: 'shadow-[0_6px_16px_rgba(0,180,216,0.45)]',
    glow: 'rgba(0,180,216,0.6)'
  },
  FileText: {
    bg: 'from-[#ffb703] via-[#fb8500] to-[#d62246]',
    shadow: 'shadow-[0_6px_16px_rgba(251,133,0,0.45)]',
    glow: 'rgba(251,133,0,0.6)'
  },
  BookOpen: {
    bg: 'from-[#fa709a] via-[#fee140] to-[#ff9900]',
    shadow: 'shadow-[0_6px_16px_rgba(250,112,154,0.45)]',
    glow: 'rgba(250,112,154,0.6)'
  },
  Search: {
    bg: 'from-[#00f5d4] via-[#00bbf9] to-[#7928ca]',
    shadow: 'shadow-[0_6px_16px_rgba(0,245,212,0.45)]',
    glow: 'rgba(0,245,212,0.6)'
  },
  Disc: {
    bg: 'from-[#c471ed] via-[#f64f59] to-[#12c2e9]',
    shadow: 'shadow-[0_6px_16px_rgba(196,113,237,0.45)]',
    glow: 'rgba(196,113,237,0.6)'
  },
  Info: {
    bg: 'from-[#43e97b] via-[#38f9d7] to-[#00c6ff]',
    shadow: 'shadow-[0_6px_16px_rgba(67,233,123,0.45)]',
    glow: 'rgba(67,233,123,0.6)'
  },
  Binary: {
    bg: 'from-[#0575e6] via-[#00f260] to-[#00c6ff]',
    shadow: 'shadow-[0_6px_16px_rgba(0,242,96,0.45)]',
    glow: 'rgba(0,242,96,0.6)'
  },
  Flame: {
    bg: 'from-[#ff0844] via-[#ffb199] to-[#ff4e50]',
    shadow: 'shadow-[0_6px_16px_rgba(255,8,68,0.45)]',
    glow: 'rgba(255,8,68,0.6)'
  },
  Globe: {
    bg: 'from-[#00c6ff] via-[#0072ff] to-[#7928ca]',
    shadow: 'shadow-[0_6px_16px_rgba(0,198,255,0.45)]',
    glow: 'rgba(0,198,255,0.6)'
  },
  Compass: {
    bg: 'from-[#f72585] via-[#b5179e] to-[#7209b7]',
    shadow: 'shadow-[0_6px_16px_rgba(247,37,133,0.45)]',
    glow: 'rgba(247,37,133,0.6)'
  },
  Monitor: {
    bg: 'from-[#4facfe] via-[#00f2fe] to-[#4361ee]',
    shadow: 'shadow-[0_6px_16px_rgba(79,172,254,0.45)]',
    glow: 'rgba(79,172,254,0.6)'
  },
  Radio: {
    bg: 'from-[#fa709a] via-[#fee140] to-[#f72585]',
    shadow: 'shadow-[0_6px_16px_rgba(250,112,154,0.45)]',
    glow: 'rgba(250,112,154,0.6)'
  },
  LayoutGrid: {
    bg: 'from-[#ff007f] via-[#7928ca] to-[#3a86ff]',
    shadow: 'shadow-[0_6px_16px_rgba(121,40,202,0.45)]',
    glow: 'rgba(121,40,202,0.6)'
  }
};

const FALLBACK_CANDY = {
  bg: 'from-[#ff007f] via-[#7928ca] to-[#00dfd8]',
  shadow: 'shadow-[0_6px_16px_rgba(255,0,127,0.45)]',
  glow: 'rgba(255,0,127,0.6)'
};

export const DesktopIconRenderer: React.FC<IconRendererProps> = ({
  iconName,
  className = 'w-6 h-6',
  size = 24,
  highlight = false
}) => {
  const { iconTheme } = useDesktop();

  // Detect image file paths (.png, .svg, .ico, .webp, .jpg), data URLs, raw SVG strings, or web URLs
  const isImageFile = 
    typeof iconName === 'string' && (
      iconName.startsWith('data:image/') ||
      iconName.startsWith('http://') ||
      iconName.startsWith('https://') ||
      iconName.startsWith('/') ||
      iconName.startsWith('./') ||
      /\.(png|svg|ico|jpg|jpeg|webp|gif)$/i.test(iconName)
    );

  const isRawSvg = typeof iconName === 'string' && iconName.trim().startsWith('<svg');

  const sanitizeSvg = (raw: string): string => {
    return raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/href\s*=\s*["']?javascript:[^"'>]+/gi, '')
      .replace(/xlink:href\s*=\s*["']?javascript:[^"'>]+/gi, '')
      .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '');
  };

  const IconComponent = ICON_MAP[iconName] || HelpCircle;

  // Render the core icon visual (vector component vs image / SVG asset)
  const renderIconGraphic = () => {
    if (isRawSvg) {
      return (
        <div 
          className="flex items-center justify-center select-none"
          style={{ width: `${size}px`, height: `${size}px` }}
          dangerouslySetInnerHTML={{ __html: sanitizeSvg(iconName) }}
        />
      );
    }

    if (isImageFile) {
      return (
        <img
          src={iconName}
          alt="app-icon"
          referrerPolicy="no-referrer"
          className="object-contain select-none pointer-events-none transition-transform"
          style={{ 
            width: `${size}px`, 
            height: `${size}px`,
            filter: iconTheme === 'cyber-matrix' 
              ? 'sepia(1) hue-rotate(85deg) saturate(3) brightness(0.95)' 
              : iconTheme === 'neon-glow'
              ? 'drop-shadow(0 0 6px rgba(192,132,252,0.7))'
              : iconTheme === 'sweet-candy'
              ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))'
              : undefined
          }}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }

    return <IconComponent className={className} size={size} />;
  };

  // 1. Sweet Gradient Candy-Icons Theme Styling
  if (iconTheme === 'sweet-candy') {
    const candy = CANDY_GRADIENTS[iconName] || FALLBACK_CANDY;
    return (
      <div 
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br ${candy.bg} ${candy.shadow} text-white border border-white/30 transition-all duration-300 transform select-none ${
          highlight 
            ? 'scale-110 ring-2 ring-white/70 shadow-[0_0_24px_rgba(255,255,255,0.45)] brightness-110' 
            : 'hover:scale-105 hover:brightness-105'
        }`}
        style={{
          padding: `${Math.max(6, Math.round(size * 0.24))}px`,
          boxShadow: highlight 
            ? `0 0 20px ${candy.glow}, 0 8px 24px rgba(0,0,0,0.4)` 
            : undefined
        }}
      >
        {/* Specular Glossy Reflection Top Sheen */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/35 via-white/10 to-transparent pointer-events-none" />
        
        {/* Subtle Bottom Ambient Darkening for 3D Specular Curvature */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-2xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {/* Center Vector Glyph */}
        <div className="relative z-10 flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
          {renderIconGraphic()}
        </div>
      </div>
    );
  }

  // 2. Neon Glow Theme Styling
  if (iconTheme === 'neon-glow') {
    return (
      <div className={`relative flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${
        highlight 
          ? 'bg-purple-500/20 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400/50' 
          : 'bg-[#151226]/80 text-[#c084fc] hover:text-[#e879f9] hover:shadow-[0_0_15px_rgba(192,132,252,0.4)] border border-[#2d224d]'
      }`}>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 opacity-70 pointer-events-none" />
        <div className="drop-shadow-[0_0_8px_rgba(192,132,252,0.6)] flex items-center justify-center">
          {renderIconGraphic()}
        </div>
      </div>
    );
  }

  // 3. Fluent Color Theme Styling
  if (iconTheme === 'fluent-color') {
    return (
      <div className={`relative flex items-center justify-center p-2 rounded-xl transition-all duration-200 ${
        highlight
          ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30'
          : 'bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-[#38bdf8] border border-sky-400/20 hover:border-sky-400/50 shadow-md'
      }`}>
        {renderIconGraphic()}
      </div>
    );
  }

  // 4. Cyber Matrix Phosphor Theme Styling
  if (iconTheme === 'cyber-matrix') {
    return (
      <div className={`relative flex items-center justify-center p-2 rounded-lg font-mono transition-all ${
        highlight
          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
          : 'bg-[#03140a]/90 text-emerald-500/90 border border-emerald-900/60 hover:border-emerald-500/60 hover:text-emerald-300'
      }`}>
        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
        {renderIconGraphic()}
      </div>
    );
  }

  // 5. Minimal Monochrome Theme Styling (Default)
  return (
    <div className={`relative flex items-center justify-center p-2 rounded-xl transition-all ${
      highlight
        ? 'bg-white text-black shadow-lg shadow-white/20'
        : 'bg-[#18181b]/80 text-[#e4e4e7] border border-[#27272a] hover:border-[#52525b] hover:bg-[#27272a]'
    }`}>
      {renderIconGraphic()}
    </div>
  );
};
