'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ComponentProps } from 'react';

export default function PreservedLink({ href, ...props }: ComponentProps<typeof Link>) {
  const searchParams = useSearchParams();
  
  let targetHref = href.toString();
  
  // If it's a full URL, we don't modify it easily.
  if (!targetHref.startsWith('http') && typeof window !== 'undefined') {
    try {
      const targetUrl = new URL(targetHref, window.location.origin);
      if (searchParams) {
        searchParams.forEach((value, key) => {
          if (!targetUrl.searchParams.has(key)) {
            targetUrl.searchParams.append(key, value);
          }
        });
      }
      targetHref = targetUrl.pathname + targetUrl.search + targetUrl.hash;
    } catch (e) {
      // Ignore if URL parsing fails
    }
  }
  
  return <Link href={targetHref} {...props} />;
}
