// Seam for optional AI features (not wired into the UI yet).
//
// Everything in Deckforge works without AI. When an AI provider is added
// (for example the Claude API through a small server-side proxy, so no key
// ships to the browser), it plugs in here and only ever *proposes* changes:
// the editor applies them as normal, undoable edits that the user can review.

import type { Deck, Slide } from '../model/types';

export interface OutlineSuggestion {
  outline: string; // same plain-text format the Outline panel accepts
}

export interface AiProvider {
  name: string;
  /** Draft a slide outline from a prompt or pasted notes. */
  draftOutline(prompt: string, deck: Deck): Promise<OutlineSuggestion>;
  /** Rewrite one slide's text to be shorter or clearer; returns HTML per element id. */
  rewriteSlide(slide: Slide, deck: Deck, instruction: string): Promise<Record<string, string>>;
  /** Draft speaker notes for a slide. */
  draftNotes(slide: Slide, deck: Deck): Promise<string>;
}

/** Default provider: AI is off. */
export const noAi: AiProvider = {
  name: 'none',
  async draftOutline() {
    throw new Error('AI features are not enabled in this build.');
  },
  async rewriteSlide() {
    throw new Error('AI features are not enabled in this build.');
  },
  async draftNotes() {
    throw new Error('AI features are not enabled in this build.');
  },
};

let current: AiProvider = noAi;
export const getAi = () => current;
export const setAi = (p: AiProvider) => {
  current = p;
};
