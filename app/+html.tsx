import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Web-only HTML shell. Used during static export for every route.
// Adds iOS PWA / Add-to-Home-Screen meta + safe-area viewport.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />

        <meta name="theme-color" content="#10B981" />
        <meta name="application-name" content="Nabung Woi" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nabung Woi" />
        <meta name="mobile-web-app-capable" content="yes" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-1024.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="1024x1024" href="/icons/icon-1024.png" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: rawCss }} />
        <script dangerouslySetInnerHTML={{ __html: swRegister }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

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
//   green html/body background bleeding as empty strips top and bottom. Pinning
//   to the visual viewport makes the app fill the screen edge-to-edge.
// - overscroll-behavior to kill bounce-into-nothing
const rawCss = `
html, body {
  margin: 0;
  height: 100%;
  background-color: #10B981;
}
body {
  overflow: hidden;
  overscroll-behavior-y: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
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
}
`;
