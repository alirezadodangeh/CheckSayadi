export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

export function isJalaliLeap(year: number): boolean {
  const a = year > 0 ? year - 474 : year - 473;
  const b = ((a % 2820) + 2820) % 2820;
  return ((b + 38) * 682) % 2816 < 682;
}

export function daysInJalaliMonth(year: number, month: number): number {
  if (month >= 1 && month <= 6) return 31;
  if (month >= 7 && month <= 11) return 30;
  if (month === 12) return isJalaliLeap(year) ? 30 : 29;
  return 0;
}

export function formatShamsi(year: number, month: number, day: number): string {
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

export function parseShamsi(value: string | null | undefined): JalaliDate | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const maxDay = daysInJalaliMonth(year, month);
  if (maxDay === 0 || day < 1 || day > maxDay) return null;
  return { year, month, day };
}

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const gDayOffset = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    gDayOffset[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const month = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const day = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { year: jy, month, day };
}

export function todayJalali(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
