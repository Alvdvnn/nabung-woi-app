export const TAB_BAR_HEIGHT = 62;

// FAB sits at the lower-right corner on every screen, same visual height —
// overlapping the tab bar's right edge on tabbed screens (Material-style).
export function fabBottomForTabScreen(insetsBottom: number): number {
  return insetsBottom + 16;
}

export function fabBottomForFullScreen(insetsBottom: number): number {
  return insetsBottom + 16;
}
