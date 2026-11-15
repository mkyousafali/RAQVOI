# RAQVOI static store demo

Deployment, preview access protection and security requirements: [deployment guide](deployment/README.md).

Svelte 5 + TypeScript + Vite. Global CSS, reusable UI components, dedicated page components and browser-local stores are separate files. Prices use INR and product displays contain no people.

## Open the finished website

Double-click `index.html` in the delivered `raqvoi-website` folder. That entry point has the compiled JavaScript and CSS inlined so it also works from a local file URL. Keep its `assets` folder next to it. Internet access is optional for Google Fonts; system fallback fonts work offline.

## Develop

Install Node.js 22 or newer. From the source folder run:

```text
npm ci
npm run dev
```

Open the local address printed by Vite. To check and build:

```text
npm run check
npm run build
node scripts/portable.mjs
```

`dist/` is the deployable static website. Host it on any static web server. Hash routes support direct links without server rewrite rules.

## Demo functionality

- Twelve sample product records with six product-only AI-generated photo concepts.
- Collection, search, category/colour/size/price filters, sale filter and sorting.
- Product pages, size guide, image zoom, size selection and quantities.
- Wishlist and cart persisted in localStorage; quantity limit of ten per variant.
- WELCOME15 (15%) and HER10 (10%) coupons; only one coupon at a time.
- INR totals: shipping is ₹99 below a ₹3,500 pre-coupon subtotal and free at or above it.
- Validated demo checkout, order confirmation, browser-local order history and clear-data controls.
- Offers, brand story, help, sizing and privacy routes; responsive desktop/mobile layouts.

This does not accept real payments, create accounts, send emails, submit newsletter addresses, or fulfill orders. Checkout asks for sample name, email and city only. Do not use it as a production store without implementing backend validation and real policies.

## Source map

- `src/pages/`: route pages.
- `src/lib/components/`: header, footer, product cards and order summary.
- `src/lib/data/products.ts`: typed demo catalogue and INR formatter.
- `src/lib/stores/commerce.ts`: local cart, wishlist, offers and orders.
- `src/lib/stores/router.ts`: static hash routing.
- `src/styles.css`: design tokens, components and responsive styles.
- `tests/store.test.mjs`: browser shopping-flow checks. Set `RAQVOI_URL` to a running preview and `RAQVOI_CHROME` to an installed Chromium executable before `npm test` when using another machine.

## Later backend integration

Replace the demo catalogue and browser stores with a data-access layer backed by the future self-hosted Supabase service. Keep server-owned prices, inventory, discount validation, payment and order creation on trusted server endpoints. Add real authentication and role-based admin access with row-level security. Never place service-role credentials in frontend source. Backend, login and admin are intentionally deferred.
