export const TAB_BAR_HEIGHT = 62;

export function fabBottomForTabScreen(insetsBottom: number): number {
  return TAB_BAR_HEIGHT + insetsBottom + 16;
}

export function fabBottomForFullScreen(insetsBottom: number): number {
  return insetsBottom + 24;
}
