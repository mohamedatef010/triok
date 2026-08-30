import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Robust formatter for video duration.
 * Converts seconds or numbers into clean Russian localized duration strings.
 * Filters out 0 seconds and never displays "0мин" or "0Мин".
 */
export function formatDuration(seconds?: number | string | null): string | null {
  if (seconds === null || seconds === undefined || seconds === "") return null;

  if (typeof seconds === "string") {
    const trimmed = seconds.trim();
    // Filter out "0", "0мин", "0Мин", "0 мин", "0:00", "00:00", etc.
    if (/^(0+(\.0+)?|\b0+\s*(мин|м|min|m|ч|h|sec|сек)?|00:00|0:00)$/i.test(trimmed)) {
      return null;
    }
    const num = Number(trimmed);
    if (!isNaN(num)) {
      seconds = num;
    } else {
      return trimmed;
    }
  }

  const numSeconds = Math.round(Number(seconds));
  if (isNaN(numSeconds) || numSeconds <= 0) return null;

  const h = Math.floor(numSeconds / 3600);
  const m = Math.floor((numSeconds % 3600) / 60);
  const s = numSeconds % 60;

  if (h > 0) {
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
  }
  if (m > 0) {
    return s > 0 ? `${m} мин ${s} сек` : `${m} мин`;
  }
  if (s > 0) {
    return `${s} сек`;
  }
  return null;
}
