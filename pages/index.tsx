import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import Head from 'next/head';
import { ExchangeRateChart } from '@/components/ExchangeRateChart';

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

type OutputMode = 'day' | 'none';

export default function Home() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mode, setMode] = useState<OutputMode>('day');
  const [data, setData] = useState<FullOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/summary?start=${startDate}&end=${endDate}&mode=${mode}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = () => {
    fetchData();
  };

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  return (
    <>
      <Head>
        <title>Exchange Rate Tracker</title>
        <meta name="description" content="Analyze EUR to USD exchange rates over time" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Exchange Rate Tracker</h1>
            <p className="text-lg text-gray-600">Analyze EUR to USD exchange rates over time</p>
          </header>

          {/* Date Range Picker */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Exchange Rate Analysis</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  min={startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-2">
                  Output Mode
                </label>
                <select
                  id="mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as OutputMode)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="day">Show Daily Data</option>
                  <option value="none">Summary Only</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !startDate || !endDate}
                  className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Analyze'}
                </button>
              </div>
            </div>
            
            {/* Quick Select Buttons */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Quick select:</span>
              <button
                onClick={() => handleQuickSelect(7)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Last 7 days
              </button>
              <button
                onClick={() => handleQuickSelect(30)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Last 30 days
              </button>
              <button
                onClick={() => handleQuickSelect(90)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Last 90 days
              </button>
            </div>
          </div>

          {/* Loading Spinner */}
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleSubmit}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Summary Cards - Always show if we have data */}
          {data && !isLoading && !error && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500">Start Rate</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.summary.start_rate ? data.summary.start_rate.toFixed(4) : 'N/A'}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500">End Rate</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.summary.end_rate ? data.summary.end_rate.toFixed(4) : 'N/A'}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500">Total Change</h4>
                  <p className={`text-2xl font-bold ${
                    data.summary.total_pct_change && data.summary.total_pct_change > 0 
                      ? 'text-green-600' 
                      : data.summary.total_pct_change && data.summary.total_pct_change < 0 
                        ? 'text-red-600' 
                        : 'text-gray-900'
                  }`}>
                    {data.summary.total_pct_change ? `${data.summary.total_pct_change > 0 ? '+' : ''}${data.summary.total_pct_change.toFixed(2)}%` : 'N/A'}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500">Average Rate</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.summary.mean_rate ? data.summary.mean_rate.toFixed(4) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chart - Only show if we have daily data */}
          {data && !isLoading && !error && data.days.length > 0 && (
            <>
              <div className="mt-6">
                <ExchangeRateChart data={data.days} summary={data.summary} />
              </div>

              {/* Daily Data Table */}
              <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Daily Data</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.days.map((day, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {day.rate ? day.rate.toFixed(4) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {day.pct_change !== null ? (
                              <span className={`font-medium ${
                                day.pct_change > 0 ? 'text-green-600' : 
                                day.pct_change < 0 ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                {day.pct_change > 0 ? '+' : ''}{day.pct_change.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
