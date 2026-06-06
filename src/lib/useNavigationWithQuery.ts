'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function useNavigationWithQuery() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getUrl = (url: string) => {
    // If it's a full URL, don't modify it easily, or just parse it
    if (url.startsWith('http')) return url;
    
    // We use a dummy base URL to parse relative paths safely
    const targetUrl = new URL(url, 'http://localhost');
    
    // Preserve all search params
    if (searchParams) {
      searchParams.forEach((value, key) => {
        if (!targetUrl.searchParams.has(key)) {
          targetUrl.searchParams.append(key, value);
        }
      });
    }
    
    return targetUrl.pathname + targetUrl.search + targetUrl.hash;
  };

  return {
    ...router,
    push: (url: string, options?: any) => router.push(getUrl(url), options),
    replace: (url: string, options?: any) => router.replace(getUrl(url), options),
  };
}
