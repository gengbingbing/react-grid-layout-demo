import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface PriceLineChartProps {
  id?: string;
  list: Array<{
    timestamp: number;
    value: number;
  }>;
  lineColor: string;
}

const PriceLineChart = ({ id = 'priceChartId', list, lineColor }: PriceLineChartProps) => {
  return (
    <div style={{ height: '20px', width: '220px', borderRadius: '8px', overflow: 'hidden' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={list || []} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceLineChart;