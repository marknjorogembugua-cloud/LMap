"use client";

import { useState, useCallback } from "react";

/**
 * Returns a `key` to put on an icon element and a `bump` function to call
 * from onClick — incrementing the key remounts the icon so the CSS
 * `icon-pop` keyframe animation replays on every click.
 */
export function useTap() {
  const [tapKey, setTapKey] = useState(0);
  const bump = useCallback(() => setTapKey((k) => k + 1), []);
  return { tapKey, bump };
}
