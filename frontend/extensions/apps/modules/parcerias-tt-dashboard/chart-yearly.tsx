import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CHART_WIDTH = 760;
const CHART_HEIGHT = 430;
const PADDING = {
  top: 58,
  right: 24,
  bottom: 54,
  left: 66,
};
const BLUE = '#647cf4';
const GREEN = '#20b978';

interface ChartYearlyProps {
  data: Array<{
    year: string;
    withoutTransfer: number;
    withTransfer: number;
  }>;
  totals: {
    withTransfer: number;
    withoutTransfer: number;
  };
  onYearlySelect: (
    year: string,
    transfer: 'withTransfer' | 'withoutTransfer',
  ) => void;
  onTransferSelect: (transfer: 'withTransfer' | 'withoutTransfer') => void;
}

function niceMax(value: number): number {
  if (value <= 0) {
    return 10;
  }

  return Math.ceil(value / 20) * 20;
}

export function ChartYearly({
  data,
  totals,
  onYearlySelect,
  onTransferSelect,
}: ChartYearlyProps): React.JSX.Element {
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const values = data.flatMap((item) => [
    item.withoutTransfer,
    item.withTransfer,
  ]);
  const maxValue = niceMax(Math.max(0, ...values));
  const yTicks = Array.from({ length: 6 }, (_, index) =>
    Math.round((maxValue / 5) * index),
  );
  const groupWidth = plotWidth / Math.max(data.length, 1);
  const barWidth = Math.min(34, groupWidth / 4);

  const yPosition = (value: number) =>
    PADDING.top + plotHeight - (value / maxValue) * plotHeight;

  return (
    <Card
      className="min-h-[560px]"
      data-test-id="parcerias-tt-chart-yearly"
    >
      <CardHeader className="py-4">
        <CardTitle className="border-l-4 border-l-[#246b73] pl-3 text-base">
          Demandas gerais
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-[430px] w-full"
          role="img"
          aria-label="Demandas gerais por ano e transferência de tecnologia"
        >
          <g className="text-xs">
            <rect
              x={PADDING.left}
              y={PADDING.top}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
            />

            <g
              className="cursor-pointer"
              onClick={() => onTransferSelect('withoutTransfer')}
            >
              <rect
                x={CHART_WIDTH / 2 - 116}
                y="18"
                width="12"
                height="12"
                fill={BLUE}
              />
              <text
                x={CHART_WIDTH / 2 - 98}
                y="28"
                className="fill-slate-700"
              >
                Sem Transferência de Tecnologia
              </text>
            </g>
            <g
              className="cursor-pointer"
              onClick={() => onTransferSelect('withTransfer')}
            >
              <rect
                x={CHART_WIDTH / 2 + 90}
                y="18"
                width="12"
                height="12"
                fill={GREEN}
              />
              <text
                x={CHART_WIDTH / 2 + 108}
                y="28"
                className="fill-slate-700"
              >
                Com Transferência de Tecnologia
              </text>
            </g>

            {yTicks.map((tick) => {
              const y = yPosition(tick);

              return (
                <g key={tick}>
                  <line
                    x1={PADDING.left}
                    x2={PADDING.left + plotWidth}
                    y1={y}
                    y2={y}
                    stroke="#e2e8f0"
                  />
                  <text
                    x={PADDING.left - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-600"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            <text
              x="18"
              y={PADDING.top + plotHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90 18 ${PADDING.top + plotHeight / 2})`}
              className="fill-slate-700 font-semibold"
            >
              Total de demandas
            </text>

            {data.map((item, index) => {
              const groupCenter =
                PADDING.left + groupWidth * index + groupWidth / 2;
              const withoutHeight =
                (item.withoutTransfer / maxValue) * plotHeight;
              const withHeight = (item.withTransfer / maxValue) * plotHeight;
              const withoutY = PADDING.top + plotHeight - withoutHeight;
              const withY = PADDING.top + plotHeight - withHeight;
              const withoutX = groupCenter - barWidth - 3;
              const withX = groupCenter + 3;

              return (
                <g key={item.year}>
                  <g
                    className="cursor-pointer"
                    onClick={() => onYearlySelect(item.year, 'withoutTransfer')}
                  >
                    <rect
                      x={withoutX}
                      y={withoutY}
                      width={barWidth}
                      height={withoutHeight}
                      rx="6"
                      fill={BLUE}
                    />
                  </g>
                  <g
                    className="cursor-pointer"
                    onClick={() => onYearlySelect(item.year, 'withTransfer')}
                  >
                    <rect
                      x={withX}
                      y={withY}
                      width={barWidth}
                      height={withHeight}
                      rx="6"
                      fill={GREEN}
                    />
                  </g>
                  <text
                    x={withoutX + barWidth / 2}
                    y={withoutY - 8}
                    textAnchor="middle"
                    className="fill-slate-900 text-xs font-bold"
                  >
                    {item.withoutTransfer}
                  </text>
                  <text
                    x={withX + barWidth / 2}
                    y={withY - 8}
                    textAnchor="middle"
                    className="fill-slate-900 text-xs font-bold"
                  >
                    {item.withTransfer}
                  </text>
                  <text
                    x={groupCenter}
                    y={PADDING.top + plotHeight + 30}
                    textAnchor="middle"
                    className="fill-slate-700"
                  >
                    {item.year}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t pt-4 text-sm">
          <button
            type="button"
            className="flex items-center gap-2 hover:text-[#246b73]"
            onClick={() => onTransferSelect('withoutTransfer')}
          >
            <span className="size-3 rounded-sm bg-[#647cf4]" />
            <span className="text-muted-foreground">Total sem TT:</span>
            <strong>{totals.withoutTransfer}</strong>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 hover:text-[#246b73]"
            onClick={() => onTransferSelect('withTransfer')}
          >
            <span className="size-3 rounded-sm bg-[#20b978]" />
            <span className="text-muted-foreground">Total com TT:</span>
            <strong>{totals.withTransfer}</strong>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
