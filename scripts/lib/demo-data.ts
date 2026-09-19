/**
 * The cast of the demo.
 *
 * Names, notes and requests that read like a real book of business rather than
 * "Test User 1". A presenter opens the bookings board in front of a client and
 * the first thing the client reads is this data — so it has to look like a
 * Tuesday, not like a fixture file.
 */

export const guestNames: readonly string[] = [
  'Layla Al Marzooqi', 'Tom Whitfield', 'Priya Raghunathan', 'Omar Barakat',
  'Hannah Steyn', 'Yusuf Rahman', 'Claire Dubois', 'Mahmoud El Sayed',
  'Aisha Khan', 'Daniel Okafor', 'Rania Haddad', 'Jae-won Park',
  'Sofia Marchetti', 'Karim Nasser', 'Beatrice Lund', 'Arjun Mehta',
  'Noor Al Balushi', 'Peter Nagy', 'Fatima Zahra', 'Elliot Grant',
  'Zeynep Demir', 'Marcus Feld', 'Amira Chaouki', 'Ravi Pillai',
  'Georgia Papadopoulos', 'Hassan Al Rayes', 'Ingrid Haugen', 'Tariq Siddiqui',
];

export const specialRequests: readonly (string | null)[] = [
  null, null, null,
  'Window table if you have one — it is her birthday.',
  'One of us is coeliac. Nothing that has shared a toaster, please.',
  'Bringing a pram, so somewhere we are not blocking the aisle would help.',
  'Quiet corner if possible — it is a work conversation.',
  'We will be about ten minutes late, sorry in advance.',
  null,
  'Allergic to pistachio. Genuinely allergic, not a preference.',
  'Can we sit outside if the weather holds?',
  null,
  'First time — put us wherever you think is best.',
];

export const enquiries: readonly {
  name: string; email: string; phone: string | null;
  topic: 'general' | 'feedback' | 'press' | 'careers' | 'private_hire' | 'wholesale';
  message: string;
  status: 'new' | 'in_progress' | 'closed';
  daysAgo: number;
}[] = [
  {
    name: 'Dana Farouk', email: 'dana.farouk@example.ae', phone: '+971501234567',
    topic: 'private_hire',
    message:
      'Hello — I am looking at venues for a book launch in late November, around 45 people, standing, 7pm to 10pm. Would the courtyard work for that? Happy to come and see it any weekday morning.',
    status: 'new', daysAgo: 0,
  },
  {
    name: 'Michael Osei', email: 'm.osei@example.com', phone: null,
    topic: 'wholesale',
    message:
      'We run a small co-working space in Al Serkal and are looking to move off commodity beans. Could you send a wholesale list and minimum order? We would go through roughly 8kg a month.',
    status: 'in_progress', daysAgo: 1,
  },
  {
    name: 'Ines Bouchard', email: 'ines.b@example.fr', phone: '+971559876543',
    topic: 'feedback',
    message:
      'Came in on Saturday with my sister and just wanted to say the kunafa french toast was the best thing I have eaten in Dubai. Also whoever was on bar explained the Guji to us for ten minutes without making us feel stupid. Thank you.',
    status: 'closed', daysAgo: 3,
  },
  {
    name: 'Samir Wahba', email: 'samir.wahba@example.com', phone: '+971524441122',
    topic: 'careers',
    message:
      'Two years on bar at a specialty place in Cairo, SCA Barista Skills Intermediate, moving to Dubai in October. Is there any chance of a trial shift? CV attached — or I can just come in and make you a coffee.',
    status: 'new', daysAgo: 4,
  },
  {
    name: 'Rebecca Lim', email: 'r.lim@examplepress.com', phone: '+971503338899',
    topic: 'press',
    message:
      'I write the food column for a regional title and I am putting together a piece on Dubai roasteries for the November issue. Could I book 30 minutes with Nadia, ideally on a roast day?',
    status: 'in_progress', daysAgo: 6,
  },
];

export const subscribers: readonly { email: string; name: string | null; confirmed: boolean; daysAgo: number }[] = [
  { email: 'layla.marzooqi@example.ae', name: 'Layla Al Marzooqi', confirmed: true, daysAgo: 41 },
  { email: 't.whitfield@example.com', name: 'Tom Whitfield', confirmed: true, daysAgo: 38 },
  { email: 'priya.r@example.in', name: 'Priya Raghunathan', confirmed: true, daysAgo: 31 },
  { email: 'obarakat@example.com', name: null, confirmed: true, daysAgo: 27 },
  { email: 'hannah.steyn@example.za', name: 'Hannah Steyn', confirmed: true, daysAgo: 22 },
  { email: 'yusuf.rahman@example.com', name: 'Yusuf Rahman', confirmed: true, daysAgo: 19 },
  { email: 'claire.dubois@example.fr', name: 'Claire Dubois', confirmed: true, daysAgo: 15 },
  { email: 'aisha.k@example.ae', name: 'Aisha Khan', confirmed: true, daysAgo: 11 },
  { email: 'd.okafor@example.com', name: 'Daniel Okafor', confirmed: true, daysAgo: 8 },
  { email: 'sofia.marchetti@example.it', name: 'Sofia Marchetti', confirmed: true, daysAgo: 5 },
  { email: 'karim.nasser@example.com', name: 'Karim Nasser', confirmed: false, daysAgo: 2 },
  { email: 'b.lund@example.no', name: 'Beatrice Lund', confirmed: false, daysAgo: 0 },
];

export const tables: readonly {
  code: string; label: string; labelAr: string;
  seatsMin: number; seatsMax: number;
  zone: 'window' | 'main' | 'counter' | 'courtyard' | 'mezzanine';
  shape: 'round' | 'square' | 'rect' | 'booth';
  accessible: boolean;
  x: number; y: number; w: number; h: number;
}[] = [
  // Window bench, along the glazed north wall.
  { code: 'W1', label: 'Window 1', labelAr: 'نافذة ١', seatsMin: 1, seatsMax: 2, zone: 'window', shape: 'square', accessible: false, x: 6, y: 8, w: 9, h: 9 },
  { code: 'W2', label: 'Window 2', labelAr: 'نافذة ٢', seatsMin: 1, seatsMax: 2, zone: 'window', shape: 'square', accessible: false, x: 18, y: 8, w: 9, h: 9 },
  { code: 'W3', label: 'Window 3', labelAr: 'نافذة ٣', seatsMin: 2, seatsMax: 3, zone: 'window', shape: 'square', accessible: false, x: 30, y: 8, w: 10, h: 9 },
  { code: 'W4', label: 'Window 4', labelAr: 'نافذة ٤', seatsMin: 2, seatsMax: 4, zone: 'window', shape: 'rect', accessible: true, x: 43, y: 8, w: 13, h: 9 },
  // Main floor.
  { code: 'M1', label: 'Table 1', labelAr: 'طاولة ١', seatsMin: 2, seatsMax: 4, zone: 'main', shape: 'round', accessible: true, x: 8, y: 26, w: 11, h: 11 },
  { code: 'M2', label: 'Table 2', labelAr: 'طاولة ٢', seatsMin: 2, seatsMax: 4, zone: 'main', shape: 'round', accessible: true, x: 24, y: 26, w: 11, h: 11 },
  { code: 'M3', label: 'Table 3', labelAr: 'طاولة ٣', seatsMin: 2, seatsMax: 4, zone: 'main', shape: 'round', accessible: true, x: 40, y: 26, w: 11, h: 11 },
  { code: 'M4', label: 'Table 4', labelAr: 'طاولة ٤', seatsMin: 4, seatsMax: 6, zone: 'main', shape: 'rect', accessible: true, x: 8, y: 44, w: 16, h: 11 },
  { code: 'M5', label: 'Table 5', labelAr: 'طاولة ٥', seatsMin: 4, seatsMax: 6, zone: 'main', shape: 'rect', accessible: true, x: 29, y: 44, w: 16, h: 11 },
  { code: 'M6', label: 'Booth 6', labelAr: 'مقصورة ٦', seatsMin: 2, seatsMax: 4, zone: 'main', shape: 'booth', accessible: false, x: 50, y: 44, w: 14, h: 11 },
  // The long communal table.
  { code: 'C1', label: 'Long table (north end)', labelAr: 'الطاولة الطويلة — الشمال', seatsMin: 1, seatsMax: 4, zone: 'main', shape: 'rect', accessible: true, x: 8, y: 62, w: 26, h: 9 },
  { code: 'C2', label: 'Long table (south end)', labelAr: 'الطاولة الطويلة — الجنوب', seatsMin: 1, seatsMax: 4, zone: 'main', shape: 'rect', accessible: true, x: 37, y: 62, w: 26, h: 9 },
  // Counter, facing the bar.
  { code: 'B1', label: 'Bar seat 1', labelAr: 'مقعد البار ١', seatsMin: 1, seatsMax: 1, zone: 'counter', shape: 'square', accessible: false, x: 70, y: 12, w: 7, h: 7 },
  { code: 'B2', label: 'Bar seat 2', labelAr: 'مقعد البار ٢', seatsMin: 1, seatsMax: 1, zone: 'counter', shape: 'square', accessible: false, x: 70, y: 22, w: 7, h: 7 },
  { code: 'B3', label: 'Bar seat 3', labelAr: 'مقعد البار ٣', seatsMin: 1, seatsMax: 2, zone: 'counter', shape: 'square', accessible: false, x: 70, y: 32, w: 7, h: 7 },
  // Courtyard.
  { code: 'Y1', label: 'Courtyard 1', labelAr: 'الفناء ١', seatsMin: 2, seatsMax: 4, zone: 'courtyard', shape: 'round', accessible: true, x: 80, y: 50, w: 12, h: 12 },
  { code: 'Y2', label: 'Courtyard 2', labelAr: 'الفناء ٢', seatsMin: 2, seatsMax: 4, zone: 'courtyard', shape: 'round', accessible: true, x: 80, y: 66, w: 12, h: 12 },
  { code: 'Y3', label: 'Courtyard long', labelAr: 'الفناء — طاولة طويلة', seatsMin: 5, seatsMax: 8, zone: 'courtyard', shape: 'rect', accessible: true, x: 72, y: 82, w: 22, h: 10 },
];

/** weekday: 1 = Monday … 7 = Sunday. */
export const servicePeriods: readonly {
  name: string; nameAr: string; weekdays: readonly number[];
  startsAt: string; lastSeatingAt: string;
  slotInterval: number; turnTime: number; buffer: number; maxCovers: number;
}[] = [
  {
    name: 'Morning', nameAr: 'الصباح', weekdays: [1, 2, 3, 4, 5],
    startsAt: '07:15', lastSeatingAt: '11:15',
    slotInterval: 15, turnTime: 75, buffer: 15, maxCovers: 20,
  },
  {
    name: 'Midday', nameAr: 'الظهيرة', weekdays: [1, 2, 3, 4, 5],
    startsAt: '11:30', lastSeatingAt: '15:45',
    slotInterval: 15, turnTime: 90, buffer: 15, maxCovers: 24,
  },
  {
    name: 'Evening', nameAr: 'المساء', weekdays: [1, 2, 3, 4, 5],
    startsAt: '16:00', lastSeatingAt: '20:30',
    slotInterval: 30, turnTime: 105, buffer: 15, maxCovers: 18,
  },
  {
    name: 'Weekend brunch', nameAr: 'برانش نهاية الأسبوع', weekdays: [6, 7],
    startsAt: '08:15', lastSeatingAt: '15:45',
    slotInterval: 15, turnTime: 105, buffer: 20, maxCovers: 28,
  },
  {
    name: 'Weekend evening', nameAr: 'مساء نهاية الأسبوع', weekdays: [6],
    startsAt: '16:00', lastSeatingAt: '20:30',
    slotInterval: 30, turnTime: 105, buffer: 15, maxCovers: 18,
  },
  {
    name: 'Sunday evening', nameAr: 'مساء الأحد', weekdays: [7],
    startsAt: '16:00', lastSeatingAt: '19:00',
    slotInterval: 30, turnTime: 105, buffer: 15, maxCovers: 16,
  },
];

export const orderNotes: readonly (string | null)[] = [
  null, null,
  'Oat milk in both, please.',
  'No sugar anywhere near it.',
  'Can you leave it on the counter — I will grab and run.',
  'Extra hot, sorry.',
  null,
  'Please double bag the beans, they are a gift.',
];
