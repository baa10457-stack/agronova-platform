'use client';

import { appDictionaries } from './appDictionaries';
import { useLanguage } from './LanguageProvider';

export function useAppText() {
  return appDictionaries[useLanguage().language];
}
