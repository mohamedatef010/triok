import React, { useState } from "react";
import { Zap, Flame, Sparkles, Award, ShieldAlert } from "lucide-react";

export interface DifficultyConfig {
  level: number;
  labelRu: string;
  descriptionRu: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  dotActiveBg: string;
  dotGlow: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DIFFICULTY_LEVELS: Record<number, DifficultyConfig> = {
  1: {
    level: 1,
    labelRu: "Легкий",
    descriptionRu: "Подходит для новичков, без сложной ловкости рук",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/15",
    borderClass: "border-emerald-500/30",
    dotActiveBg: "bg-emerald-500",
    dotGlow: "shadow-[0_0_6px_rgba(16,185,129,0.5)]",
    icon: Sparkles,
  },
  2: {
    level: 2,
    labelRu: "Базовый",
    descriptionRu: "Простые движения, требуется немного практики",
    colorClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-500/10 dark:bg-teal-500/15",
    borderClass: "border-teal-500/30",
    dotActiveBg: "bg-teal-500",
    dotGlow: "shadow-[0_0_6px_rgba(20,184,166,0.5)]",
    icon: Zap,
  },
  3: {
    level: 3,
    labelRu: "Средний",
    descriptionRu: "Требует отработки моторики и тайминга",
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 dark:bg-amber-500/15",
    borderClass: "border-amber-500/30",
    dotActiveBg: "bg-amber-500",
    dotGlow: "shadow-[0_0_6px_rgba(245,158,11,0.5)]",
    icon: Flame,
  },
  4: {
    level: 4,
    labelRu: "Сложный",
    descriptionRu: "Продвинутая техника и уверенный контроль зрителя",
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500/10 dark:bg-orange-500/15",
    borderClass: "border-orange-500/30",
    dotActiveBg: "bg-orange-500",
    dotGlow: "shadow-[0_0_6px_rgba(249,115,22,0.5)]",
    icon: Award,
  },
  5: {
    level: 5,
    labelRu: "Профи",
    descriptionRu: "Высшее мастерство иллюзии, виртуозная ловкость",
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-500/10 dark:bg-rose-500/15",
    borderClass: "border-rose-500/30",
    dotActiveBg: "bg-rose-500",
    dotGlow: "shadow-[0_0_8px_rgba(244,63,94,0.6)]",
    icon: ShieldAlert,
  },
};

export function getDifficultyConfig(diff?: number | null): DifficultyConfig {
  const level = Math.max(1, Math.min(5, Math.round(Number(diff || 1))));
  return DIFFICULTY_LEVELS[level] || DIFFICULTY_LEVELS[1];
}

interface TrickDifficultyBadgeProps {
  difficulty?: number | null;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  showScore?: boolean;
  showIcon?: boolean;
  className?: string;
}

/**
 * شارة عرض مستوى صعوبة الخدعة من 5 دوائر (للزائرين وصفحات العرض)
 */
export function TrickDifficultyBadge({
  difficulty = 1,
  size = "md",
  showLabel = true,
  showScore = true,
  showIcon = false,
  className = "",
}: TrickDifficultyBadgeProps) {
  const currentLevel = Math.max(1, Math.min(5, Math.round(Number(difficulty || 1))));
  const config = getDifficultyConfig(currentLevel);
  const Icon = config.icon;

  const dotSizeClasses = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  const badgePadding = {
    xs: "px-2 py-0.5 text-[11px]",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-xs",
    lg: "px-3.5 py-2 text-sm",
  };

  const gapClasses = {
    xs: "gap-1.5",
    sm: "gap-2",
    md: "gap-2.5",
    lg: "gap-3",
  };

  return (
    <div
      className={`inline-flex items-center ${gapClasses[size]} rounded-full font-bold transition-all border backdrop-blur-md ${config.bgClass} ${config.borderClass} ${config.colorClass} ${badgePadding[size]} ${className}`}
      title={`Сложность: ${currentLevel}/5 · ${config.labelRu}`}
    >
      {showIcon && <Icon className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} />}

      {/* 5 Indicator Dots */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((dot) => {
          const isActive = dot <= currentLevel;
          return (
            <span
              key={dot}
              className={`rounded-full transition-all duration-200 ${dotSizeClasses[size]} ${
                isActive
                  ? `${config.dotActiveBg} ${config.dotGlow}`
                  : "bg-slate-300 dark:bg-slate-700/80"
              }`}
            />
          );
        })}
      </div>

      {/* Text label & score */}
      {showLabel && (
        <span className="font-bold tracking-tight">
          {config.labelRu}
        </span>
      )}

      {showScore && (
        <span className="text-[10px] sm:text-xs opacity-75 font-semibold font-mono">
          ({currentLevel}/5)
        </span>
      )}
    </div>
  );
}

interface TrickDifficultySelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * مكون اختيار مستوى الصعوبة للأدمن (5 دوائر تفاعلية ذات تأثيرات بصرية جذابة)
 */
export function TrickDifficultySelector({
  value = 1,
  onChange,
  disabled = false,
  className = "",
}: TrickDifficultySelectorProps) {
  const currentVal = Math.max(1, Math.min(5, Math.round(Number(value || 1))));
  const [hoveredVal, setHoveredVal] = useState<number | null>(null);

  const activeLevel = hoveredVal !== null ? hoveredVal : currentVal;
  const config = getDifficultyConfig(activeLevel);

  return (
    <div className={`grid gap-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold flex items-center gap-2">
          <span>🎯 Сложность трюка</span>
          <span className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            {activeLevel} из 5
          </span>
        </label>
        <span className={`text-xs font-bold transition-colors ${config.colorClass}`}>
          {config.labelRu}
        </span>
      </div>

      {/* 5 Interactive Circles Selector */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-3">
        <div
          className="flex items-center gap-2.5 sm:gap-3"
          onMouseLeave={() => setHoveredVal(null)}
        >
          {[1, 2, 3, 4, 5].map((level) => {
            const itemConfig = DIFFICULTY_LEVELS[level];
            const isSelected = level <= activeLevel;
            const isCurrentTarget = level === activeLevel;

            return (
              <button
                key={level}
                type="button"
                disabled={disabled}
                onClick={() => onChange(level)}
                onMouseEnter={() => setHoveredVal(level)}
                className={`relative group flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCurrentTarget ? "scale-115" : "hover:scale-110"
                }`}
                title={`${level}/5 — ${itemConfig.labelRu}`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2 ${
                    isSelected
                      ? `${itemConfig.dotActiveBg} text-white border-transparent ${itemConfig.dotGlow}`
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-400 dark:hover:border-slate-600"
                  }`}
                >
                  {level}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic description box */}
        <div className="text-xs text-muted-foreground text-center sm:text-right font-medium">
          <span className="block text-slate-700 dark:text-slate-300 font-bold">
            {config.labelRu} — {config.level}/5
          </span>
          <span className="text-[11px] opacity-80">{config.descriptionRu}</span>
        </div>
      </div>
    </div>
  );
}
