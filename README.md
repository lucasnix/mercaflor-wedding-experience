# Mercaflor — Wedding Floral Experience

An independent website concept exploring an immersive digital
experience for a wedding florist in Punta Cana.

## Overview

The project combines a scroll-driven 3D flower, wedding footage,
and editorial typography in a mobile-first bilingual website.

This is an independent concept, not an official Mercaflor website.
Stock photography and video are used for visual inspiration.

## Features

- Interactive WebGL flower animated through scrolling
- Spanish and English content
- Responsive layouts for mobile and desktop
- Silent wedding video montage with playback controls
- Video playback paused when outside the viewport
- Reduced-motion support
- Downloadable wedding inquiry brief

## Technology

- HTML
- CSS
- JavaScript
- WebGL
- FFmpeg for video editing and compression

## Design and implementation

The experience explores the transition from a single flower
to a wedding celebration.

Mobile layouts separate the flower from the main heading
to preserve readability. Video footage uses dark gradients
to maintain text contrast.

The background montage is approximately 11 seconds long
and less than 1 MB.

## Run locally

With Python installed, run:

python -m http.server 8765

Then open http://localhost:8765.

## Current limitations

- The inquiry form downloads a brief; it does not send messages.
- Imagery represents visual inspiration, not Mercaflor client work.
- Autoplay availability depends on browser and device settings.

## Asset credits

See ASSET-SOURCES.md for sources and credits.
Third-party assets remain subject to their respective licenses.

## Author

Lucas Ramos
Clic Pic Web — https://web.clicpic.co
