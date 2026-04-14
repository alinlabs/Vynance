const CURRENCY_LOCALES: Record<string, string> = {
  IDR: 'id-ID',
  USD: 'en-US',
  EUR: 'de-DE',
  JPY: 'ja-JP',
  GBP: 'en-GB',
  CNY: 'zh-CN',
  KRW: 'ko-KR',
  MYR: 'ms-MY',
  SGD: 'en-SG',
  AUD: 'en-AU',
};

export const formatCurrency = (amount: number, overrideCurrency?: string) => {
  const currency = overrideCurrency || localStorage.getItem('vinance_currency') || 'IDR';
  const locale = CURRENCY_LOCALES[currency] || 'id-ID';
  
  const mode = localStorage.getItem('vinance_number_format_mode') || 'separator';
  const decimals = parseInt(localStorage.getItem('vinance_number_format_decimals') || '0', 10);
  const system = localStorage.getItem('vinance_number_format_system') || 'id';

  // Format Indonesia: titik untuk ribuan, koma untuk desimal
  // Kita akan menggunakan locale 'id-ID' untuk mendapatkan format dasar ini.
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (absAmount < 1000 || mode === 'separator') {
    // Mode Separator Murni atau angka < 1000
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  }

  // Mode Format Singkat (Compact)
  let divisor = 1;
  let suffix = '';

  if (system === 'id') {
    if (absAmount >= 1e12) { divisor = 1e12; suffix = 'T'; }
    else if (absAmount >= 1e9) { divisor = 1e9; suffix = 'M'; }
    else if (absAmount >= 1e6) { divisor = 1e6; suffix = 'jt'; }
    else if (absAmount >= 1e3) { divisor = 1e3; suffix = 'rb'; }
  } else {
    if (absAmount >= 1e9) { divisor = 1e9; suffix = 'B'; }
    else if (absAmount >= 1e6) { divisor = 1e6; suffix = 'M'; }
    else if (absAmount >= 1e3) { divisor = 1e3; suffix = 'k'; }
  }

  let value = absAmount / divisor;

  // Default to round
  const factor = Math.pow(10, decimals);
  value = Math.round(value * factor) / factor;

  // Format the number part using id-ID locale
  const formattedNumber = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  // Add currency symbol (using Intl.NumberFormat to get the symbol)
  const parts = new Intl.NumberFormat('id-ID', { style: 'currency', currency }).formatToParts(1);
  let prefix = '';
  let suffixStr = '';
  
  let isPrefix = true;
  for (const part of parts) {
    if (part.type === 'currency') {
      if (isPrefix) prefix += part.value;
      else suffixStr += part.value;
    } else if (part.type === 'literal') {
      if (isPrefix) prefix += part.value;
      else suffixStr += part.value;
    } else {
      isPrefix = false;
    }
  }
  
  // Format: Rp 9,00rb
  return `${isNegative ? '-' : ''}${prefix}${formattedNumber}${suffix}${suffixStr}`;
};

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
};

const BANK_CODE_MAP: Record<string, string> = {
  'Bank Central Asia': 'bca',
  'Bank Negara Indonesia': 'bni',
  'Bank Rakyat Indonesia': 'bri',
  'Bank Mandiri': 'mandiri',
  'Bank Tabungan Negara': 'btn',
  'Bank Jago': 'jago',
  'Bank Neo': 'neo',
  'SeaBank': 'seabank',
  'Allo Bank': 'allo',
  'DANA': 'dana',
  'OVO': 'ovo',
  'GoPay': 'gopay',
  'ShopeePay': 'shopeepay',
};

const BANK_LOGO_MAP: Record<string, string> = {
  'bca': 'https://i.pinimg.com/736x/29/61/0b/29610b7dbf7e4ea5070626923a12cba8.jpg',
  'bni': 'https://i0.wp.com/amanahfurniture.com/wp-content/uploads/2022/10/logo-bni-46.png',
  'bri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Logo_Bank_Rakyat_Indonesia.svg/250px-Logo_Bank_Rakyat_Indonesia.svg.png',
  'mandiri': 'https://ui-avatars.com/api/?name=BM&background=1e3a8a&color=fff',
  'btn': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/BTN_2024.svg/250px-BTN_2024.svg.png',
  'jago': 'https://www.jago.com/favicon/og-image.png',
  'neo': 'https://play-lh.googleusercontent.com/29-fa8r-aNxlmlyijeoxWbA41ak5wwB5sX8R1o50pIYEwjSDQb-d6GrApVeyJn3ddw=s48-rw',
  'seabank': 'https://play-lh.googleusercontent.com/ZGLrjk0PKIj2L4DaWiKmhAf0f6cBXml6eHgjRpJhQ4XQpGvw4T5d4hjl_EQF5jY9Vked=s48-rw',
  'allo': 'https://play-lh.googleusercontent.com/0gw4GVJoKuQCDIz8DOXt5fQDEy-RD0BDnQge-BsbnBaBTmXWgqjydABvetmCqTXE1Gm2=w48-h48-rw',
  'dana': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRhvs9h_tTVvV-4g-BE7r4ALtNl5wvkuNwAg&s',
  'ovo': 'https://iconlogovector.com/uploads/images/2024/03/lg-65e38949ad9b9-OVO.webp',
  'gopay': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU1_u4kBagPaDWERIyFFmDI8VxkzZEd4YFWQ&s',
  'shopeepay': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnQ54gdjaHKfhtVWT3C1n-gLZljKqucGLOeg&s'
};

export const getBankCode = (providerName: string): string => {
  return BANK_CODE_MAP[providerName] || providerName.toLowerCase().replace(/\s+/g, '');
};

export const getBankNameFromCode = (code: string): string => {
  const entry = Object.entries(BANK_CODE_MAP).find(([_, v]) => v === code.toLowerCase());
  return entry ? entry[0] : code.toUpperCase();
};

export const getBankLogoFromCode = (code: string): string | undefined => {
  return BANK_LOGO_MAP[code.toLowerCase()];
};
