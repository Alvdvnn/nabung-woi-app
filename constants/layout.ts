export const TAB_BAR_HEIGHT = 62;
export const FAB_SIZE = 56;
export const FAB_BOTTOM_OFFSET = 16;

// FAB sits at the lower-right corner on every screen, same visual height —
// overlapping the tab bar's right edge on tabbed screens (Material-style).
export function fabBottomForTabScreen(insetsBottom: number): number {
  return insetsBottom + FAB_BOTTOM_OFFSET;
}

export function fabBottomForFullScreen(insetsBottom: number): number {
  return insetsBottom + FAB_BOTTOM_OFFSET;
}

// Bottom padding for scroll content on screens that show a FAB,
// so the last item isn't covered by the floating button.
export function contentBottomForFab(insetsBottom: number): number {
  return insetsBottom + FAB_BOTTOM_OFFSET + FAB_SIZE + 16;
}
