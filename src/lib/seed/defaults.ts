import type { UserProfile, Achievement, PieceSkin, BoardTheme } from "../../types/domain.ts";

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: "user_default",
  displayName: "Knight",
  level: 1,
  totalXp: 0,
  keys: 3,
  currentStreak: 0,
  longestStreak: 0,
  createdAt: new Date().toISOString(),
};

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "ach_first_lesson",
    name: "First Steps",
    description: "Complete your first lesson.",
    iconUrl: "/achievements/first-lesson.svg",
  },
  {
    id: "ach_first_perfect_run",
    name: "Perfect Form",
    description: "Complete a lesson with no mistakes.",
    iconUrl: "/achievements/first-perfect-run.svg",
  },
  {
    id: "ach_first_mastered",
    name: "Mastered",
    description: "Reach mastery on your first lesson.",
    iconUrl: "/achievements/first-mastered.svg",
  },
  {
    id: "ach_first_world",
    name: "World Champion",
    description: "Master every lesson in a world.",
    iconUrl: "/achievements/first-world.svg",
  },
  {
    id: "ach_streak_7",
    name: "Dedicated Knight",
    description: "Maintain a 7-day practice streak.",
    iconUrl: "/achievements/streak-7.svg",
  },
  {
    id: "ach_perfect_10",
    name: "Flawless",
    description: "Complete 10 perfect training runs.",
    iconUrl: "/achievements/perfect-10.svg",
  },
];

export const DEFAULT_PIECE_SKIN: PieceSkin = {
  id: "skin_classic",
  name: "Classic",
  description: "The standard chess piece set.",
  pieceType: "all",
  unlocked: true,
  previewUrl: "/skins/classic.svg",
};

export const DEFAULT_PIECE_SKINS: PieceSkin[] = [
  DEFAULT_PIECE_SKIN,
  {
    id: "skin_blue",
    name: "Ocean Blue",
    description: "Cool blue-tinted pieces.",
    pieceType: "all",
    unlocked: true,
    previewUrl: "/skins/blue.svg",
  },
  {
    id: "skin_gold",
    name: "Royal Gold",
    description: "Warm gold-tinted pieces.",
    pieceType: "all",
    unlocked: false,
    previewUrl: "/skins/gold.svg",
  },
];

export const DEFAULT_BOARD_THEME: BoardTheme = {
  id: "theme_classic",
  name: "Classic",
  description: "Traditional wood-coloured board.",
  unlocked: true,
  previewUrl: "/themes/classic.svg",
  lightSquareColor: "#f0d9b5",
  darkSquareColor: "#b58863",
};

export const DEFAULT_BOARD_THEMES: BoardTheme[] = [
  DEFAULT_BOARD_THEME,
  {
    id: "theme_wood",
    name: "Dark Wood",
    description: "Rich dark wood board.",
    unlocked: true,
    previewUrl: "/themes/wood.svg",
    lightSquareColor: "#c8a882",
    darkSquareColor: "#6b4226",
  },
  {
    id: "theme_dark",
    name: "Midnight",
    description: "Deep blue and charcoal board.",
    unlocked: false,
    previewUrl: "/themes/dark.svg",
    lightSquareColor: "#4a5568",
    darkSquareColor: "#1a202c",
  },
  {
    id: "theme_royal",
    name: "Royal",
    description: "Cream and purple royal board.",
    unlocked: false,
    previewUrl: "/themes/royal.svg",
    lightSquareColor: "#faf5e8",
    darkSquareColor: "#6b46c1",
  },
];
