import { Bookmark } from '../types';

const STORAGE_KEY = 'gistfm_bookmarks';

export const getBookmarks = (): Bookmark[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load bookmarks", e);
    return [];
  }
};

export const saveBookmark = (bookmark: Bookmark): void => {
  try {
    const bookmarks = getBookmarks();
    // Avoid duplicates by ID
    if (!bookmarks.some(b => b.id === bookmark.id)) {
      const updated = [bookmark, ...bookmarks];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Failed to save bookmark", e);
  }
};

export const removeBookmark = (id: string): void => {
  try {
    const bookmarks = getBookmarks();
    const updated = bookmarks.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to remove bookmark", e);
  }
};

export const isScriptBookmarked = (script: string): boolean => {
  const bookmarks = getBookmarks();
  // Simple check based on script content equality to detect existing saves
  return bookmarks.some(b => b.script === script);
};