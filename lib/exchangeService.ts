import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { cache } from './cache';

const API_BASE = process.env.FRANK_API_URL || 'https://api.frankfurter.dev/v1';
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '60', 10);
const RETRY_ATTEMPTS = parseInt(process.env.RETRY_ATTEMPTS || '3', 10);
const RETRY_BACKOFF = parseFloat(process.env.RETRY_BACKOFF || '0.5');
const FALLBACK_FILE = process.env.FALLBACK_FILE || 'data/sample_sk.json';
const FROM_CURRENCY = 'EUR';
const TO_CURRENCY = 'USD';

interface DayOutput {
  date: string;
  rate: number | null;
  pct_change: number | null;
}

interface SummaryOutput {
  start_rate: number | null;
  end_rate: number | null;
  total_pct_change: number | null;
  mean_rate: number | null;
}

interface FullOutput {
  days: DayOutput[];
  summary: SummaryOutput;
}

interface ExchangeRateResponse {
  rates?: Record<string, Record<string, number>>;
  [key: string]: any;
}

async function fetchWithRetries(url: string, params: Record<string, string>): Promise<any> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < RETRY_ATTEMPTS; i++) {
    try {
      console.log(`API request attempt ${i + 1}/${RETRY_ATTEMPTS} to ${url}`);
      const response = await axios.get(url, {
        params,
        timeout: 10000,
      });
      console.log(`API request successful on attempt ${i + 1}`);
      return response.data;
    } catch (error) {
      lastError = error as Error;
      console.warn(`API request attempt ${i + 1} failed:`, error);
      
      if (i < RETRY_ATTEMPTS - 1) {
        const sleepTime = RETRY_BACKOFF * Math.pow(2, i);
        console.log(`Retrying in ${sleepTime} seconds...`);
        await new Promise(resolve => setTimeout(resolve, sleepTime * 1000));
      }
    }
  }
  
  console.error(`All ${RETRY_ATTEMPTS} API request attempts failed`);
  throw lastError;
}

async function fetchRatesFromApi(start: Date, end: Date, from: string, to: string): Promise<ExchangeRateResponse> {
  const key = `api::${start.toISOString()}::${end.toISOString()}::${from}->${to}`;
  console.log(`Fetching rates for ${from}->${to} from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`);
  
  const cached = cache.get<ExchangeRateResponse>(key);
  if (cached) {
    console.log('Returning cached data');
    return cached;
  }

  const url = `${API_BASE}/${start.toISOString().split('T')[0]}..${end.toISOString().split('T')[0]}`;
  const params = { from, to };
  
  try {
    console.log(`Fetching exchange rates from API: ${url}`);
    const data = await fetchWithRetries(url, params);
    cache.set(key, data, CACHE_TTL);
    console.log('Successfully fetched and cached exchange rates from API');
    return data;
  } catch (error) {
    console.warn(`API request failed: ${error}. Attempting fallback to local file.`);
    
    // Fallback to local file
    try {
      const fallbackPath = path.join(process.cwd(), FALLBACK_FILE);
      console.log(`Loading fallback data from ${fallbackPath}`);
      const fileContent = await fs.readFile(fallbackPath, 'utf-8');
      const data = JSON.parse(fileContent);
      cache.set(key, data, CACHE_TTL);
      console.log('Successfully loaded fallback data');
      return data;
    } catch (fileError) {
      console.error(`Both API and fallback failed. API error: ${error}, Fallback error: ${fileError}`);
      throw new Error(`Failed to fetch exchange rates from API and fallback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

function dateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

export async function getSummary(start: string, end: string, mode: 'day' | 'none' = 'day'): Promise<FullOutput> {
  console.log(`Summary request received: start=${start}, end=${end}, mode=${mode}`);
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.warn(`Invalid date format provided: start=${start}, end=${end}`);
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }
  
  if (startDate > endDate) {
    console.warn(`Invalid date range: start=${startDate} > end=${endDate}`);
    throw new Error('start must be <= end');
  }

  console.log('Fetching raw exchange rate data');
  const raw = await fetchRatesFromApi(startDate, endDate, FROM_CURRENCY, TO_CURRENCY);

  // Normalize: build a dict date_str -> rate
  const ratesByDate: Record<string, number | null> = {};
  
  if (typeof raw === 'object' && raw !== null) {
    if ('rates' in raw && typeof raw.rates === 'object' && raw.rates !== null) {
      for (const [date, rates] of Object.entries(raw.rates)) {
        if (typeof rates === 'object' && rates !== null && TO_CURRENCY in rates) {
          ratesByDate[date] = rates[TO_CURRENCY];
        }
      }
    }
  }

  const days: DayOutput[] = [];
  let prevRate: number | null = null;
  
  for (const date of dateRange(startDate, endDate)) {
    const key = date.toISOString().split('T')[0];
    const rate = ratesByDate[key] || null;
    
    let pctChange: number | null = null;
    if (prevRate !== null && prevRate !== 0 && rate !== null) {
      pctChange = ((rate - prevRate) / prevRate) * 100;
    }
    
    days.push({
      date: key,
      rate,
      pct_change: pctChange,
    });
    
    prevRate = rate;
  }

  // Calculate summary
  const startRate = days.length > 0 ? days[0].rate : null;
  const endRate = days.length > 0 ? days[days.length - 1].rate : null;
  const validRates = days.filter(d => d.rate !== null).map(d => d.rate!);
  
  let totalPctChange: number | null = null;
  if (startRate !== null && startRate !== 0 && endRate !== null) {
    totalPctChange = ((endRate - startRate) / startRate) * 100;
  }
  
  const meanRate = validRates.length > 0 
    ? validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length 
    : null;

  const summary: SummaryOutput = {
    start_rate: startRate,
    end_rate: endRate,
    total_pct_change: totalPctChange,
    mean_rate: meanRate,
  };

  console.log(`Summary calculation completed: ${days.length} days processed, ` +
             `start_rate=${startRate}, end_rate=${endRate}, ` +
             `total_pct_change=${totalPctChange?.toFixed(2)}%`);

  return {
    days: mode === 'day' ? days : [],
    summary,
  };
}
