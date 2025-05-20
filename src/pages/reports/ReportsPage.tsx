import { useState } from 'react';
import { PlusIcon } from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

const ReportsPage = () => {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(currentYear);

  const handleRunReports = () => {
    // Placeholder for running reports
    alert(`Generating report for ${month}/${year}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Generate Monthly Outcomes</h1>
        <div className="border-b border-gray-300 mb-8" />
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
          <div className="flex items-center gap-2">
            <label htmlFor="month" className="text-lg text-gray-700 font-medium">Month</label>
            <select
              id="month"
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="year" className="text-lg text-gray-700 font-medium">Year</label>
            <select
              id="year"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleRunReports}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap cursor-pointer"
        >
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Run Reports
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;
