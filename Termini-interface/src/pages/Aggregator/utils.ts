// 时间单位常量
const TIME_UNITS = {
  YEAR: 31536000,
  MONTH: 2592000,
  DAY: 86400,
  HOUR: 3600,
  MINUTE: 60
} as const;

// 数值单位常量
const NUMBER_UNITS = [
  { value: 1e30, symbol: 'N' },
  { value: 1e27, symbol: 'O' },
  { value: 1e24, symbol: 'Sp' },
  { value: 1e21, symbol: 'S' },
  { value: 1e18, symbol: 'Qi' },
  { value: 1e15, symbol: 'Q' },
  { value: 1e12, symbol: 'T' },
  { value: 1e9, symbol: 'B' },
  { value: 1e6, symbol: 'M' },
  { value: 1e3, symbol: 'K' }
] as const;

export const getCreateTimeText = (timestamp: number): string => {
  if (!timestamp) return "--";

  const past = new Date(timestamp * 1000).getTime();
  const now = new Date().getTime();
  const seconds = Math.floor((now - past) / 1000);

  const { YEAR, MONTH, DAY, HOUR, MINUTE } = TIME_UNITS;

  if (seconds < 0) return "--";
  
  if (seconds < MINUTE) return `${seconds} s ago`;
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)} m ago`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)} h ago`;
  if (seconds < MONTH) return `${Math.floor(seconds / DAY)} d ago`;
  if (seconds < YEAR) return `${Math.floor(seconds / MONTH)} mo ago`;
  return `${Math.floor(seconds / YEAR)} y ago`;
};

export function formatNumberKM(
  input: string | number, 
  digits: boolean = true, 
  fixedNum: number = 4
): string {
  const num = Number(input);
  if (isNaN(num) || !isFinite(num)) return '0';

  const floorFixed = (number: number, digits: number): string => {
    const factor = 10 ** digits;
    return (Math.floor(number * factor) / factor).toFixed(digits);
  };

  for (const { value, symbol } of NUMBER_UNITS) {
    if (num >= value) {
      return floorFixed(num / value, 2) + symbol;
    }
  }

  return floorFixed(num, fixedNum);
}

export const formatDecimalWithSubscript = (number: number): string => {
  if (!isFinite(number) || isNaN(number)) return '0';

  const numberString = number.toFixed(10);
  const match = numberString.match(/0*\.(0+)(\d*)/);
  
  if (!match) return numberString;

  const [, trailingZeros, significantPart] = match;
  const subscriptCount = trailingZeros.length;
  
  if (subscriptCount === 0) return numberString;
  
  // Unicode 下标字符的基础值是 8320
  const subscript = String.fromCharCode(8320 + subscriptCount);
  return `0.0${subscript}${significantPart}`;
};

export const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return "--";
  
  try {
    const date = new Date(timestamp * 1000);
    
    const format = (num: number): string => String(num).padStart(2, '0');
    
    const month = format(date.getMonth() + 1);
    const day = format(date.getDate());
    const hours = format(date.getHours());
    const minutes = format(date.getMinutes());
    
    return `${month}/${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return "--";
  }
};

/**
 * 将时间单位转换为秒数
 * @param value 数值
 * @param unit 单位（分钟、小时、天）
 * @returns 对应的秒数
 */
export const convertToSeconds = (value: number, unit: string): number => {
  switch (unit) {
    case 'Minute':
      return value * 60;
    case 'Hour':
      return value * 60 * 60;
    case 'Day':
      return value * 24 * 60 * 60;
    default:
      return value; // 如果单位不匹配，则返回原值
  }
}

