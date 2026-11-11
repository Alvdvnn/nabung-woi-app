import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import { type PropsWithChildren } from 'react';
import { PALETTES } from '../constants/theme';

// Web-only HTML shell. Used during static export for every route.
// Adds iOS PWA / Add-to-Home-Screen meta + safe-area viewport.
//
// SDK 58: the router no longer injects anything on its own. `headNodes`
// carries the generated styles and metadata, `bodyNodes` carries the JS
// bundles; leave either out and the page renders blank and never hydrates.
export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();
  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content"
        />

        {/* Default light background. ThemeContext rewrites this at runtime so
            the iOS status bar and Android address bar follow the active palette. */}
        <meta name="theme-color" content="#f4f6f9" />
        <meta name="application-name" content="Nabung Woi" />

        {/* iOS PWA. status-bar-style "default" keeps the status bar opaque and
            starts the web content BELOW it (like Android), so there is no
            translucent overlay forcing a safe-area-inset-top gap above the
            TopBar. "black-translucent" would overlay and reintroduce the gap. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nabung Woi" />
        <meta name="mobile-web-app-capable" content="yes" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: rawCss }} />
        <script dangerouslySetInnerHTML={{ __html: prePaintTheme }} />
        <script dangerouslySetInnerHTML={{ __html: swRegister }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}

// Background color per palette/mode, baked in at export time so the very first
// paint (before React and AsyncStorage) already matches the stored theme.
const BG_BY_PALETTE = JSON.stringify(
  Object.fromEntries(
    Object.values(PALETTES).map((p) => [p.id, { light: p.light.bg, dark: p.dark.bg }]),
  ),
);

// Reads the stored theme straight from localStorage (AsyncStorage on web
// stores keys verbatim) and paints the body before the bundle loads. Avoids
// the white flash dark-mode users would otherwise see on every launch.
const prePaintTheme = `
(function () {
  try {
    var bgs = ${BG_BY_PALETTE};
    var raw = localStorage.getItem('nw.theme');
    var palette = 'default';
    var mode = localStorage.getItem('nw.themeMode') || 'system';
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && bgs[parsed.palette]) palette = parsed.palette;
      if (parsed && parsed.mode) mode = parsed.mode;
    }
    var dark = mode === 'dark' || (mode === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var bg = bgs[palette][dark ? 'dark' : 'light'];
    document.documentElement.style.backgroundColor = bg;
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg);
    document.addEventListener('DOMContentLoaded', function () { document.body.style.backgroundColor = bg; });
  } catch (e) {}
})();
`;

// Registers the service worker after first paint so it never blocks startup.
// Skipped on dev servers (Metro/Expo) so hot reload keeps working.
const swRegister = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    var host = location.hostname;
    var isDev = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
    if (isDev) return;
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
`;

// Hardens the body against iOS Safari quirks:
// - #root pinned with position:fixed/inset:0 instead of 100dvh. In an iOS
//   standalone PWA (added to home screen) 100dvh miscalculates and leaves the
//   html/body background bleeding as empty strips top and bottom. Pinning
//   to the visual viewport makes the app fill the screen edge-to-edge.
// - overscroll-behavior to kill bounce-into-nothing
// - inputs never render below 16px (see fontSize.input) so iOS does not zoom
const rawCss = `
html, body {
  margin: 0;
  height: 100%;
  /* App bg (default light). Rewritten at runtime by the theme so any pixel
     that peeks out behind the safe areas blends with the UI. */
  background-color: #f4f6f9;
}
body {
  overflow: hidden;
  overscroll-behavior-y: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-font-smoothing: antialiased;
}
#root {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
input, textarea {
  -webkit-user-select: text;
  user-select: text;
  font-size: max(16px, 1em);
}
`;
