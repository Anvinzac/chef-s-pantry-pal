/**
 * Special days data for Vietnam - lunar calendar events & festivals.
 * Dates are approximate for 2025-2026. In production, use a lunar calendar API.
 */

interface SpecialDay {
  date: string; // YYYY-MM-DD
  label: string;
  emoji: string;
  impact: 'high' | 'medium' | 'low';
}

// Key Vietnamese lunar/festival dates (approximate Gregorian dates for 2025-2026)
const specialDays: SpecialDay[] = [
  // 2025
  { date: '2025-01-29', label: 'Tết Nguyên Đán', emoji: '🧧', impact: 'high' },
  { date: '2025-02-12', label: 'Rằm tháng Giêng (Full Moon)', emoji: '🌕', impact: 'high' },
  { date: '2025-02-27', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2025-03-14', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2025-03-28', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2025-04-07', label: 'Thanh Minh', emoji: '🪦', impact: 'medium' },
  { date: '2025-04-13', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2025-04-27', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2025-05-01', label: 'Labour Day', emoji: '🎉', impact: 'high' },
  { date: '2025-05-05', label: 'Giỗ Tổ Hùng Vương', emoji: '🏛️', impact: 'high' },
  { date: '2025-05-12', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2025-05-27', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2025-05-31', label: 'Tết Đoan Ngọ', emoji: '🐉', impact: 'high' },
  { date: '2025-06-11', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2025-06-25', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2025-07-10', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2025-07-25', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2025-08-09', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2025-08-23', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2025-08-25', label: 'Vu Lan (Rằm tháng 7)', emoji: '🪷', impact: 'high' },
  { date: '2025-09-02', label: 'National Day', emoji: '🇻🇳', impact: 'high' },
  { date: '2025-09-07', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2025-09-21', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2025-10-06', label: 'Tết Trung Thu (Full Moon)', emoji: '🥮', impact: 'high' },
  { date: '2025-10-21', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2025-11-05', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2025-11-20', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2025-12-04', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2025-12-20', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2025-12-25', label: 'Christmas', emoji: '🎄', impact: 'medium' },

  // 2026
  { date: '2026-01-03', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2026-01-18', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2026-02-01', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2026-02-09', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2026-02-17', label: 'Tết Nguyên Đán', emoji: '🧧', impact: 'high' },
  { date: '2026-03-03', label: 'Rằm tháng Giêng (Full Moon)', emoji: '🌕', impact: 'high' },
  { date: '2026-03-19', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2026-04-02', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2026-04-17', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2026-05-01', label: 'Labour Day & Full Moon', emoji: '🎉', impact: 'high' },
  { date: '2026-05-16', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2026-05-31', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2026-06-15', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2026-06-19', label: 'Tết Đoan Ngọ', emoji: '🐉', impact: 'high' },
  { date: '2026-06-29', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2026-07-14', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2026-07-29', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2026-08-13', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2026-08-14', label: 'Vu Lan (Rằm tháng 7)', emoji: '🪷', impact: 'high' },
  { date: '2026-08-27', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2026-09-02', label: 'National Day', emoji: '🇻🇳', impact: 'high' },
  { date: '2026-09-11', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2026-09-25', label: 'Tết Trung Thu (Full Moon)', emoji: '🥮', impact: 'high' },
  { date: '2026-10-11', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2026-10-25', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2026-11-10', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2026-11-24', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2026-12-10', label: 'New Moon', emoji: '🌑', impact: 'medium' },
  { date: '2026-12-24', label: 'Full Moon', emoji: '🌕', impact: 'medium' },
  { date: '2026-12-25', label: 'Christmas', emoji: '🎄', impact: 'medium' },
];

export function getSpecialDay(dateStr: string): SpecialDay | undefined {
  return specialDays.find(d => d.date === dateStr);
}

export function formatTomorrowDate(): { formatted: string; isoDate: string } {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = days[tomorrow.getDay()];
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  
  const yyyy = tomorrow.getFullYear();
  const isoDate = `${yyyy}-${mm}-${dd}`;
  
  return { formatted: `${day}, ${dd}/${mm}`, isoDate };
}
