import React from 'react';

export enum TabView {
  EXPLORE = 'EXPLORE',
  SIGIL_CRAFTER = 'SIGIL_CRAFTER',
  CHAT_ORACLE = 'CHAT_ORACLE',
  VISUAL_GNOSIS = 'VISUAL_GNOSIS',
  ASTRAL_PROJECTION = 'ASTRAL_PROJECTION',
  TAROT_READER = 'TAROT_READER'
}

export interface SigilResult {
  svg: string;
  explanation: string;
  mantra: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface SymbolInfo {
  id: string;
  name: string;
  shortDesc: string;
  fullDesc?: string;
  svgIcon: React.ReactNode;
}

export interface TarotCard {
  id: string;
  name: string;
  suit?: 'Wands' | 'Cups' | 'Swords' | 'Disks';
  rank?: string; // Number or Court Title
  arcana: 'Major' | 'Minor';
  thothTitle?: string; // e.g., "Virtue" for 3 of Wands
}

export interface TarotSpread {
  name: string;
  slots: { name: string; desc: string }[];
}

// Add window type extension for AI Studio specific globals
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}