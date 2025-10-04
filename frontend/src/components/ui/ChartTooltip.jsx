import React from 'react';

const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700">
            {entry.name}: <span className="font-semibold">{formatter ? formatter(entry.value) : entry.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default ChartTooltip;