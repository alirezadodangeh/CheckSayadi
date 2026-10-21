// Powered by OnSpace.AI

export interface Entry {
  id: string;
  date: string | null;
  amount: string | null;
  sayyadId: string | null;
  name: string | null;
  nationalCode: string | null;
  /** حقوقی: شناسه ملی ۱۱ رقمی */
  isLegal?: boolean;
  checkSerial: string | null;
  rawText: string;
  createdAt: number;
  /** توضیحات */
  description?: string | null;
  /** ضمانت */
  guarantee?: boolean;
  /** چه کسی */
  forWhom?: string | null;
  /** رنگ نشانه؛ در لیست به شکل دایره کوچک */
  color?: string | null;
  /** پاس شد */
  passed?: boolean;
  /** برگشت خورده */
  returned?: boolean;
}

export interface ExtractedData {
  date: string | null;
  amount: string | null;
  sayyadId: string | null;
  name: string | null;
  nationalCode: string | null;
  /** حقوقی: شناسه ملی ۱۱ رقمی */
  isLegal?: boolean;
  checkSerial: string | null;
  rawText: string;
}

// Normalize Persian/Arabic digits to English
export function normalizeDigits(text: string): string {
  return text
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Persian/Arabic digits and separators become English. */
export function toEnglishNumeric(value: string): string {
  return normalizeDigits(value).replace(/[٬،]/g, ',');
}

/** Groups an amount as English digits, three at a time: 5000000 → 5,000,000. */
export function formatAmount(value: string): string {
  const digits = toEnglishNumeric(value).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function sanitizeNationalCode(value: string, isLegal: boolean): string {
  const digits = normalizeDigits(value).replace(/\D/g, '');
  return digits.slice(0, isLegal ? 11 : 10);
}

export function extractData(rawText: string, options?: { legal?: boolean }): ExtractedData {
  const legal = options?.legal ?? false;
  const text = normalizeDigits(rawText);

  // --- Date extraction (Shamsi: 1405/06/10 or 1405-06-10) ---
  const dateRegex = /\b(1[34]\d{2})[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/;
  const dateMatch = text.match(dateRegex);
  let date: string | null = null;
  if (dateMatch) {
    const year = dateMatch[1];
    const month = String(parseInt(dateMatch[2])).padStart(2, '0');
    const day = String(parseInt(dateMatch[3])).padStart(2, '0');
    date = `${year}/${month}/${day}`;
  }

  // --- Sayyad ID (16 digits) - extract before national code to avoid conflicts ---
  const sayyadRegex = /\b(\d{16})\b/;
  const sayyadMatch = text.match(sayyadRegex);
  const sayyadId = sayyadMatch ? sayyadMatch[1] : null;

  // --- Amount extraction ---
  // Look for explicit keywords first
  let amount: string | null = null;
  const amountKeywordRegex = /(?:مبلغ|مقدار|مجموع|جمع)[:\s]*([0-9,،٬]+)/;
  const amountKeywordMatch = text.match(amountKeywordRegex);
  if (amountKeywordMatch) {
    amount = amountKeywordMatch[1].replace(/[,،٬]/g, ',');
  } else {
    // Look for numbers with Rial/Toman suffix
    const amountCurrencyRegex = /([0-9,،٬]+)\s*(?:ریال|تومان|رياال)/;
    const amountCurrencyMatch = text.match(amountCurrencyRegex);
    if (amountCurrencyMatch) {
      amount = amountCurrencyMatch[1].replace(/[,،٬]/g, ',');
    } else {
      // Look for large numbers with separators (e.g., 1,200,000 or 1200000 >= 5 digits)
      const amountRegex = /\b(\d{1,3}(?:[,،٬]\d{3})+)\b/;
      const amountMatch = text.match(amountRegex);
      if (amountMatch) {
        amount = amountMatch[1].replace(/[,،٬]/g, ',');
      } else {
        // standalone large number >= 5 digits (not 16-digit sayyad, not 10-digit national)
        const bigNumRegex = /\b(\d{5,9})\b/;
        const bigNumMatch = text.match(bigNumRegex);
        if (bigNumMatch) {
          amount = bigNumMatch[1];
        }
      }
    }
  }

  // --- National code ---
  // حقیقی: ۱۰ رقم. حقوقی (وقتی legal روشن است): شناسه ملی ۱۱ رقم.
  let nationalCode: string | null = null;
  const textWithoutSayyad = sayyadId ? text.replace(sayyadId, ' ') : text;
  if (legal) {
    const legalKeywordRegex = /(?:شناسه\s*ملی|کد\s*ملی|شماره\s*ملی)[:\s]*(\d{11})/;
    const legalKeywordMatch = textWithoutSayyad.match(legalKeywordRegex);
    if (legalKeywordMatch) {
      nationalCode = legalKeywordMatch[1];
    } else {
      // شماره‌های ۰۹… معمولاً موبایل‌اند، نه شناسه ملی
      const legalRegex = /\b([1-9]\d{10})\b/g;
      const legalMatch = legalRegex.exec(textWithoutSayyad);
      if (legalMatch) nationalCode = legalMatch[1];
    }
  }
  if (!legal && !nationalCode) {
    const nationalKeywordRegex = /(?:کد\s*ملی|شماره\s*ملی)[:\s]*(\d{10})/;
    const nationalKeywordMatch = textWithoutSayyad.match(nationalKeywordRegex);
    if (nationalKeywordMatch) {
      nationalCode = nationalKeywordMatch[1];
    } else {
      const nationalRegex = /\b(\d{10})\b/;
      const nationalMatch = textWithoutSayyad.match(nationalRegex);
      if (nationalMatch) nationalCode = nationalMatch[1];
    }
  }

  // --- Name extraction ---
  let name: string | null = null;
  const nameKeywords = [
    /(?:نام|به\s*نام|صاحب\s*حساب|دارنده|پرداخت\s*کننده|واریز\s*کننده)[:\s،,]+([آ-یa-zA-Z\s]{3,30})/,
    /(?:آقای|خانم|جناب|سرکار)\s+([آ-ی\s]{3,20})/,
  ];
  for (const regex of nameKeywords) {
    const match = text.match(regex);
    if (match) {
      name = match[1].trim().replace(/\s+/g, ' ');
      if (name.length >= 3) break;
      else name = null;
    }
  }

  // --- Check Serial (e.g. 156/054770 — short/long digit pattern) ---
  let checkSerial: string | null = null;
  // Remove already-matched date portion to avoid false positives
  const textWithoutDate = date ? text.replace(date, '') : text;
  const checkSerialRegex = /\b(\d{1,4})\/([0-9]{4,7})\b/;
  const checkMatch = textWithoutDate.match(checkSerialRegex);
  if (checkMatch) {
    checkSerial = `${checkMatch[1]}/${checkMatch[2]}`;
  }

  if (amount) amount = formatAmount(amount);

  return {
    date,
    amount,
    sayyadId,
    name,
    nationalCode,
    checkSerial,
    rawText,
  };
}

// Convert Shamsi date string to sortable number (YYYYMMDD)
export function dateToSortKey(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return 0;
  return parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2]);
}
