# Nyota Springs Gallery — remote image edition (v2)

**No original photographs are stored in this repository or in Vercel's public folder.** All gallery images are served from URLs on `nyotasprings.com`. Next.js Image optimizes requested sizes to WebP/AVIF and lazy-loads tiles, subject to Vercel image optimization allowances and WordPress host availability.

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
npm run typecheck
npm run build
```

## Photo discovery: important
The user's ten named groups and their numeric bounds are in `lib/collections.ts`. The names are kept as written, including **Familiy** and lowercase **walk and bush breakfast**. Numeric ranges classify **existing** `IMG_####` files — they NEVER generate or assume that every number inside a range exists. The `09` in `/2026/09/` means September, NOT ZIP set nine. Direct URLs in `/nyota-gallery/set-8/`, etc., encode a set folder.

When WordPress's public REST API works, the app requests published images using `/wp-json/wp/v2/media?per_page=100&page=N` up to `WP_MAX_PAGES=20` pages (default), checks `source_url`, sorts into your ten categories by IMG number, and uses WordPress-provided dimensions. An optional `WP_AUTO_DISCOVER=false` disables this.

If WP REST is blocked (or assets are not registered as normal Media attachments), the gallery still shows **the exact supplied 20 boundary URLs plus IMG_3370-potrait.png**, and you can supply an explicit URL manifest. Images are not fabricated from numeric sequences. Confirm links; some supplied start/end URLs could be missing and will display a browser broken image until corrected.

### Guarantee full galleries when WP API is blocked
Add further real URLs to `data/extra-photos.json` (empty by default) and they will appear automatically. Use the exact filename including `-HDR`, `-potrait`, and any other real suffix — never assume suffixes or extensions. Format:
```json
[
 {"src":"https://nyotasprings.com/wp-content/uploads/2026/09/IMG_2935-HDR.jpg","width":1200,"height":800}
]
```
Only entries actually hosted and reachable should be added. `-scaled` files are deliberately skipped in API discovery except the two boundary URLs the user provided (IMG_4362-scaled, IMG_4130-scaled). If you want to exclude even those two, replace their URLs with their actual unscaled equivalents once confirmed.

If the WordPress media endpoint omits custom `nyota-gallery/set-N` files, supply those exact URLs using the extra manifest rather than guessing a sequence.

## Video slots
Open `data/videos.ts` and add your real videos using objects with `id,title,category,poster,src`. No placeholder files are downloaded or bundled. The page shows a 'Ten moments in motion' coming-soon section until URLs are provided; when set it shows video cards and click-to-play player with `preload="none"`.

## Deploy to Vercel
1. Commit and push project to a new GitHub repo. Don't commit `.env.local`.
2. Import the repository at https://vercel.com/new.
3. Add optional `WP_AUTO_DISCOVER` and `WP_MAX_PAGES` environment variables (if necessary).
4. Deploy, open Vercel's project → Settings → Domains → `gallery.nyotasprings.com`.
5. Confirm who operates authoritative DNS for `nyotasprings.com` before changing records.
6. At authoritative DNS (cPanel Zone Editor **only if your nameservers use cPanel**), replace conflicting `gallery` A/AAAA records with a `gallery` CNAME targeting the **exact value Vercel displays**. Do not modify apex, www, MX or mail records.
7. Wait for domain verification and TLS. Test both websites.

## Notes
- `WordPress uploads` bandwidth is still paid by your main website hosting; a 1GB collection will **not** automatically load because images are lazy-loaded with optimized widths.
- Vercel image transformations may count against usage quotas; assess your plan for high traffic.
- If WordPress rejects image optimization fetches, consider a dedicated CDN or disabling Next Image optimizer as a troubleshooting step.
- Photos in overlapping ranges are assigned to the first group in the order listed. Some provided range bounds overlap (Double Room 1 vs Familiy Tent 1 and Outside and lunch). **Filename number alone cannot reliably distinguish these.** For full accuracy, provide a manifest with category IDs or a URL → category mapping. See `data/extra-photos.json`.
