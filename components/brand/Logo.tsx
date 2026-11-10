import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { brand } from '../../constants/brand';

interface Props {
  /** Rendered width and height in points. */
  size?: number;
  /**
   * `tile` draws the rounded teal background (matches the app icon);
   * `mark` draws just the jar and coin for use on any surface.
   */
  variant?: 'tile' | 'mark';
  /** Corner radius of the tile as a fraction of size. Defaults to the icon's. */
  cornerRatio?: number;
}

/**
 * The brand mark as vector, identical to `assets/brand/logo.svg`. Used by the
 * splash, PIN screen, TopBar, and About so none of them ship a PNG.
 */
export default function Logo({ size = 48, variant = 'tile', cornerRatio = 224 / 1024 }: Props) {
  const tile = variant === 'tile';
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityRole="image" accessibilityLabel="Nabung Woi">
      {tile ? (
        <>
          <Defs>
            <LinearGradient id="nw-logo-bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={brand.tealLight} />
              <Stop offset="1" stopColor={brand.teal} />
            </LinearGradient>
          </Defs>
          <Rect width="1024" height="1024" rx={1024 * cornerRatio} fill="url(#nw-logo-bg)" />
        </>
      ) : null}
      <Rect x="302" y="392" width="420" height="440" rx="96" fill={brand.cream} />
      <Rect x="302" y="392" width="420" height="40" fill={brand.creamShade} />
      <Rect x="342" y="312" width="340" height="96" rx="30" fill={brand.tealDark} />
      <Rect x="452" y="344" width="120" height="30" rx="15" fill={brand.cream} />
      <Rect x="402" y="560" width="220" height="110" rx="26" fill={brand.teal} />
      <Path
        d="M452 644 L512 588 L572 644"
        fill="none"
        stroke={brand.cream}
        strokeWidth={28}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="512" cy="212" r="78" fill={brand.gold} />
      <Circle cx="512" cy="212" r="52" fill="none" stroke={brand.goldShade} strokeWidth={12} />
    </Svg>
  );
}
