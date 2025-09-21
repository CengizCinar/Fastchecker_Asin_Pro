// Theme utility functions

export const getThemeFromStorage = async (): Promise<'light' | 'dark'> => {
  try {
    const result = await chrome.storage.local.get(['theme']);
    return result.theme || 'light';
  } catch (error) {
    console.error('Failed to get theme from storage:', error);
    return 'light';
  }
};

export const saveThemeToStorage = async (theme: 'light' | 'dark'): Promise<void> => {
  try {
    await chrome.storage.local.set({ theme });
  } catch (error) {
    console.error('Failed to save theme to storage:', error);
  }
};

export const applyThemeToDocument = (theme: 'light' | 'dark'): void => {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark');
  } else {
    body.classList.remove('dark');
  }
};

export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};
