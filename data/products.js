/* =====================================================
   ROULA HARB — data/products.js
   =====================================================
   THIS IS YOUR PRODUCT CATALOGUE. No coding required.
   To add or edit a piece, follow the pattern below.

   FIELDS YOU MUST FILL IN:
   ─────────────────────────
   name        → The real title of the piece
   medium      → e.g. "Hand-painted silk organza"
   dimensions  → e.g. "180cm × 90cm" or "50cm × 50cm"
   story       → 1–2 sentences about this piece
   year        → Year created (number, no quotes)
   status      → "available"  ←or→  "sold"

   FIELDS YOU SHOULD NOT CHANGE:
   ─────────────────────────────
   id          → Must be unique — use kebab-case
   category    → "scarves" | "bags" | "wearables" | "pillows"
   collection  → "Jookh Couture" or "P-Lo"
   edition     → Keep this standard text
   views       → List of image file paths, front view first
   ===================================================== */

window.PRODUCTS = [

  /* ────────────────────────────────────────────────
     JOOKH COUTURE — SCARVES  (7 pieces)
     ──────────────────────────────────────────────── */
  {
    id:         'scarf-01',
    name:       'Colour Study No. 1',
    category:   'scarves',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium — e.g. Hand-painted silk]',
    dimensions: '[Dimensions — e.g. 180cm × 90cm]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story — e.g. Painted in response to the first light of a Beirut morning.]',
    views:      ['images/jookh/scarves/piece-1.jpeg'],
    status:     'available'
  },
  {
    id:         'scarf-02',
    name:       'Colour Study No. 2',
    category:   'scarves',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/scarves/piece-2.jpeg'],
    status:     'available'
  },
  {
    id:         'scarf-03',
    name:       'Colour Study No. 3',
    category:   'scarves',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/scarves/piece-3.jpeg'],
    status:     'available'
  },
  {
    id:         'scarf-04',
    name:       'Colour Study No. 4',
    category:   'scarves',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/scarves/piece-4.jpeg'],
    status:     'available'
  },
  {
    id:         'scarf-05',
    name:       'Colour Study No. 5',
    category:   'scarves',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/scarves/piece-5.jpeg'],
    status:     'available'
  },
  {
    id:         'scarf-06',
    name:       'Colour Study No. 6',
    category:   'scarves',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/scarves/piece-6.jpeg'],
    status:     'available'
  },
  {
    id:         'scarf-07',
    name:       'Colour Study No. 7',
    category:   'scarves',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/scarves/piece-7.jpeg'],
    status:     'available'
  },

  /* ────────────────────────────────────────────────
     JOOKH COUTURE — BAGS  (17 pieces)
     ──────────────────────────────────────────────── */
  {
    id:         'bag-01',
    name:       'Form Study No. 1',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium — e.g. Hand-painted leather]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-1.jpg'],
    status:     'available'
  },
  {
    id:         'bag-02',
    name:       'Form Study No. 2',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-2.jpg'],
    status:     'available'
  },
  {
    id:         'bag-03',
    name:       'Form Study No. 3',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-3.jpg'],
    status:     'available'
  },
  {
    id:         'bag-04',
    name:       'Form Study No. 4',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-4.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-05',
    name:       'Form Study No. 5',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-5.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-06',
    name:       'Form Study No. 6',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-6.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-07',
    name:       'Form Study No. 7',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-7.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-08',
    name:       'Form Study No. 8',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-8.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-09',
    name:       'Form Study No. 9',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-9.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-10',
    name:       'Form Study No. 10',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-10.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-11',
    name:       'Form Study No. 11',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-11.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-12',
    name:       'Form Study No. 12',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-12.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-13',
    name:       'Form Study No. 13',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-13.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-14',
    name:       'Form Study No. 14',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-14.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-15',
    name:       'Form Study No. 15',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-15.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-16',
    name:       'Form Study No. 16',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-16.jpeg'],
    status:     'available'
  },
  {
    id:         'bag-17',
    name:       'Form Study No. 17',
    category:   'bags',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views:      ['images/jookh/bags/piece-17.jpeg'],
    status:     'available'
  },

  /* ────────────────────────────────────────────────
     JOOKH COUTURE — WEARABLES  (5 pieces, multi-view)
     Front view first, back/detail views follow.
     ──────────────────────────────────────────────── */
  {
    id:         'wearable-01',
    name:       'Movement Study No. 1',
    category:   'wearables',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium — e.g. Hand-painted silk organza]',
    dimensions: '[Dimensions — e.g. One size · 140cm × 60cm]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views: [
      'images/jookh/wearables/piece-1-view-1.jpeg',
      'images/jookh/wearables/piece-1-view-2.jpeg',
      'images/jookh/wearables/piece-1-view-3.jpeg',
      'images/jookh/wearables/piece-1-view-4.jpeg',
      'images/jookh/wearables/piece-1-view-5.jpg.jpeg',
      'images/jookh/wearables/piece-1-view-6.jpg.jpeg',
      'images/jookh/wearables/piece-1-view-7.jpg.jpeg'
    ],
    status:     'available'
  },
  {
    id:         'wearable-02',
    name:       'Movement Study No. 2',
    category:   'wearables',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views: [
      'images/jookh/wearables/piece-2-view-1.jpeg',
      'images/jookh/wearables/piece-2-view-2.jpeg',
      'images/jookh/wearables/piece-2-view-3.jpeg',
      'images/jookh/wearables/piece-2-view-4.jpeg'
    ],
    status:     'available'
  },
  {
    id:         'wearable-03',
    name:       'Movement Study No. 3',
    category:   'wearables',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views: [
      'images/jookh/wearables/piece-3-view-1.jpeg',
      'images/jookh/wearables/piece-3-view-2.jpeg',
      'images/jookh/wearables/piece-3-view-3.jpeg'
    ],
    status:     'available'
  },
  {
    id:         'wearable-04',
    name:       'Movement Study No. 4',
    category:   'wearables',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views: [
      'images/jookh/wearables/piece-4-view-1.jpeg',
      'images/jookh/wearables/piece-4-view-2.jpeg',
      'images/jookh/wearables/piece-4-view-3.jpeg'
    ],
    status:     'available'
  },
  {
    id:         'wearable-05',
    name:       'Movement Study No. 5',
    category:   'wearables',
    collection: 'Jookh Couture',
    year:       2024,
    medium:     '[Medium]',
    dimensions: '[Dimensions]',
    edition:    'One-of-a-kind · Signed by the artist',
    story:      '[Story]',
    views: [
      'images/jookh/wearables/piece-5-view-1.jpeg',
      'images/jookh/wearables/piece-5-view-2.jpeg',
      'images/jookh/wearables/piece-5-view-3.jpeg',
      'images/jookh/wearables/piece-5-view-4.jpeg'
    ],
    status:     'available'
  },

  /* ────────────────────────────────────────────────
     P-LO — EMERGE SERIES  (3 pillows, 3 views each)
     ──────────────────────────────────────────────── */
  {
    id:         'pillow-01',
    name:       'Emerge No. 1',
    category:   'pillows',
    collection: 'P-Lo',
    year:       2024,
    medium:     'Hand-painted · Hand-embroidered linen',
    dimensions: '[Dimensions — e.g. 50cm × 50cm]',
    edition:    'Emerge Series · No. 01 of 1 · Signed by the artist',
    story:      '[Story]',
    views: [
      'images/plo/piece-1-view-1.jpeg',
      'images/plo/piece-1-view-2.jpeg',
      'images/plo/piece-1-view-3.jpeg'
    ],
    status:     'available'
  },
  {
    id:         'pillow-02',
    name:       'Emerge No. 2',
    category:   'pillows',
    collection: 'P-Lo',
    year:       2024,
    medium:     'Hand-painted · Hand-embroidered linen',
    dimensions: '[Dimensions]',
    edition:    'Emerge Series · No. 02 of 1 · Signed by the artist',
    story:      '[Story]',
    views: [
      'images/plo/piece-2-view-1.jpeg',
      'images/plo/piece-2-view-2.jpeg',
      'images/plo/piece-2-view-3.jpeg'
    ],
    status:     'available'
  },
  {
    id:         'pillow-03',
    name:       'Emerge No. 3',
    category:   'pillows',
    collection: 'P-Lo',
    year:       2024,
    medium:     'Hand-painted · Hand-embroidered linen',
    dimensions: '[Dimensions]',
    edition:    'Emerge Series · No. 03 of 1 · Signed by the artist',
    story:      '[Story]',
    views: [
      'images/plo/piece-3-view-1.jpeg',
      'images/plo/piece-3-view-2.jpeg',
      'images/plo/piece-3-view-3.jpeg'
    ],
    status:     'available'
  }

];
