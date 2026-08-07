# Hero styleframes / artworks

Drop your own frames here (the ones you keep in `E:\LUCAS BIGHOUSE\artworks`)
and the hero background slider will cross-fade through them.

## How to wire them

1. Copy the image files into this folder, e.g.
   `assets/artworks/mmxix.jpg`, `assets/artworks/pink-sculpture.jpg`, …
   Keep them reasonably sized (long edge ~2000px, JPG/WebP) so the page stays fast.

2. In `index.html`, find the block `HERO STYLEFRAME SLIDER` and replace the
   `FR` list with your files:

   ```js
   var FR = window.HERO_FRAMES || [
     "/assets/artworks/mmxix.jpg",
     "/assets/artworks/pink-sculpture.jpg",
     "/assets/artworks/frame-03.jpg"
     // …add as many as you like, in the order you want them to appear
   ];
   ```

Order = play order. 6–10 frames feels great. The slider auto cross-fades
every ~4s with a slow Ken-Burns push; no other change needed.

Until you add your own, the hero falls back to a curated set of your
existing styleframes.
