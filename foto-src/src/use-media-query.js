import { useEffect, useState } from 'react';

/**
 * Come lo useMediaQuery del riferimento: reattivo, quindi attraversando il
 * breakpoint (resize/rotazione) l'interfaccia commuta senza ricaricare.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', onChange);
    return () => mediaQueryList.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
