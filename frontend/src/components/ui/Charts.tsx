import React from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../../hooks/useTheme';

interface ChartProps {
  data: any[];
  height?: number;
  className?: string;
}

interface LineChartProps extends ChartProps {
  dataKey: string;
  color?: string;
  strokeWidth?: number;
}

interface AreaChartProps extends ChartProps {
  dataKey: string;
  color?: string;
  fillOpacity?: number;
}

interface BarChartProps extends ChartProps {
  dataKey: string;
  color?: string;
}

interface PieChartProps extends ChartProps {
  dataKey: string;
  nameKey: string;
  colors?: string[];
}

export const CustomLineChart: React.FC<LineChartProps> = ({
  data,
  dataKey,
  height = 300,
  color = '#3B82F6',
  strokeWidth = 2,
  className = ''
}) => {
  const { actualTheme: theme } = useTheme();

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
          />
          <XAxis
            dataKey="name"
            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            fontSize={12}
          />
          <YAxis
            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
              border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
              borderRadius: '8px',
              color: theme === 'dark' ? '#F9FAFB' : '#111827'
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={strokeWidth}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CustomAreaChart: React.FC<AreaChartProps> = ({
  data,
  dataKey,
  height = 300,
  color = '#10B981',
  fillOpacity = 0.3,
  className = ''
}) => {
  const { actualTheme: theme } = useTheme();

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={fillOpacity} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
          />
          <XAxis
            dataKey="name"
            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            fontSize={12}
          />
          <YAxis
            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
              border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
              borderRadius: '8px',
              color: theme === 'dark' ? '#F9FAFB' : '#111827'
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={`url(#gradient-${dataKey})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CustomBarChart: React.FC<BarChartProps> = ({
  data,
  dataKey,
  height = 300,
  color = '#8B5CF6',
  className = ''
}) => {
  const { actualTheme: theme } = useTheme();

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme === 'dark' ? '#374151' : '#E5E7EB'}
          />
          <XAxis
            dataKey="name"
            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            fontSize={12}
          />
          <YAxis
            stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
              border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
              borderRadius: '8px',
              color: theme === 'dark' ? '#F9FAFB' : '#111827'
            }}
          />
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CustomPieChart: React.FC<PieChartProps> = ({
  data,
  dataKey,
  nameKey,
  height = 300,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  className = ''
}) => {
  const { actualTheme: theme } = useTheme();

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
              border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
              borderRadius: '8px',
              color: theme === 'dark' ? '#F9FAFB' : '#111827'
            }}
          />
          <Legend
            wrapperStyle={{
              color: theme === 'dark' ? '#F9FAFB' : '#111827'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};