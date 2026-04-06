import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import { mockTablesPerMonth } from './-mock-data';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

const chartConfig = {
  tables: {
    label: 'Tabelas',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function ChartTables(): React.JSX.Element {
  return (
    <Card data-test-id="chart-tables">
      <CardHeader>
        <CardTitle>Tabelas Criadas por Mês</CardTitle>
        <CardDescription>
          Quantidade de tabelas criadas nos últimos meses
        </CardDescription>
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
              radius={6}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
