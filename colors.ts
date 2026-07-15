// Shared preset colors for roles and UI theming
// Used in RightSidebarUsers.tsx and ServerSettingsModal.tsx

export interface PresetColor {
  hex: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  label: string; // English label for accessibility & future i18n
}

export const PRESET_COLORS: PresetColor[] = [
  { hex: '#ef4444', textClass: 'text-red-400', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/20', label: 'Red' },
  { hex: '#f59e0b', textClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20', label: 'Gold' },
  { hex: '#10b981', textClass: 'text-green-400', bgClass: 'bg-green-500/10', borderClass: 'border-green-500/20', label: 'Green' },
  { hex: '#3b82f6', textClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20', label: 'Blue' },
  { hex: '#6366f1', textClass: 'text-indigo-400', bgClass: 'bg-indigo-500/10', borderClass: 'border-indigo-500/20', label: 'Indigo' },
  { hex: '#8b5cf6', textClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/20', label: 'Purple' },
  { hex: '#f43f5e', textClass: 'text-rose-400', bgClass: 'bg-rose-500/10', borderClass: 'border-rose-500/20', label: 'Pink' },
  { hex: '#14b8a6', textClass: 'text-teal-400', bgClass: 'bg-teal-500/10', borderClass: 'border-teal-500/20', label: 'Teal' },
];
