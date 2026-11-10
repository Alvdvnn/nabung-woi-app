import { useEffect, useState } from 'react';

/**
 * Web keyboard inset via `window.visualViewport`.
 *
 * iOS Safari does not resize the layout viewport when the keyboard opens; it
 * shrinks the *visual* viewport and lets the page scroll underneath. Because
 * `#root` is pinned with `position: fixed; inset: 0`, anything anchored to the
 * bottom would sit behind the keyboard. The difference between the layout
 * height and the visual viewport (plus its offset) is exactly the covered area.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      const covered = Math.round(window.innerHeight - vv.height - vv.offsetTop);
      // Ignore sub-50px jitter from browser chrome collapsing; that is not a keyboard.
      setInset(covered > 50 ? covered : 0);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}
