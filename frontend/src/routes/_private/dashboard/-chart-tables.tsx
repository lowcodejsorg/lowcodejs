import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

import { mockTablesPerMonth } from './-mock-data';

const chartConfig = {
  tables: {
    label: 'Tabelas',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function ChartTables(): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tabelas Criadas por Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-[200px] w-full"
        >
          <BarChart
            data={mockTablesPerMonth}
            accessibilityLayer
          >
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="tables"
              fill="var(--chart-1)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
