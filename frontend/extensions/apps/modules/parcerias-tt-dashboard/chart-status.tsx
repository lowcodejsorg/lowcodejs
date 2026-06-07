import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SVG_SIZE = 260;
const CENTER = SVG_SIZE / 2;
const OUTER_RADIUS = 102;
const INNER_RADIUS = 64;

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function createDonutSegmentPath(startAngle: number, endAngle: number): string {
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  const outerStart = polarToCartesian(CENTER, CENTER, OUTER_RADIUS, startAngle);
  const outerEnd = polarToCartesian(CENTER, CENTER, OUTER_RADIUS, endAngle);
  const innerStart = polarToCartesian(CENTER, CENTER, INNER_RADIUS, startAngle);
  const innerEnd = polarToCartesian(CENTER, CENTER, INNER_RADIUS, endAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}
interface ChartStatusProps {
  total: number;
  onStatusSelect: (status: string) => void;
  data: Array<{
    label: string;
    value: number;
    percent: number;
    fill: string;
  }>;
}

export function ChartStatus({
  total,
  onStatusSelect,
  data,
}: ChartStatusProps): React.JSX.Element {
  let currentAngle = 0;

  return (
    <Card
      className="min-h-[360px]"
      data-test-id="parcerias-tt-chart-status"
    >
      <CardHeader className="py-4">
        <CardTitle className="border-l-4 border-l-[#246b73] pl-3 text-base">
          Tipo de Situação
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid min-h-[270px] items-center gap-4 md:grid-cols-[minmax(220px,260px)_minmax(220px,1fr)]">
          <div className="flex min-w-0 justify-center">
            <svg
              viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
              className="h-[260px] w-full max-w-[260px]"
              role="img"
              aria-label={`Total geral de ${total} demandas por tipo de situação`}
            >
              {data.map((item) => {
                const angle = total > 0 ? (item.value / total) * 360 : 0;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;
                currentAngle = endAngle;
                const labelPoint = polarToCartesian(
                  CENTER,
                  CENTER,
                  (OUTER_RADIUS + INNER_RADIUS) / 2,
                  startAngle + angle / 2,
                );

                return (
                  <g
                    key={item.label}
                    className="cursor-pointer"
                    onClick={() => onStatusSelect(item.label)}
                  >
                    <path
                      d={createDonutSegmentPath(startAngle, endAngle)}
                      fill={item.fill}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {item.percent >= 3 && (
                      <text
                        x={labelPoint.x}
                        y={labelPoint.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white text-[10px] font-bold"
                      >
                        {item.percent}%
                      </text>
                    )}
                  </g>
                );
              })}

              <circle
                cx={CENTER}
                cy={CENTER}
                r={INNER_RADIUS - 2}
                fill="#ffffff"
                className="pointer-events-none"
              />
              <text
                x={CENTER}
                y={CENTER - 12}
                textAnchor="middle"
                className="fill-slate-700 text-xs"
                pointerEvents="none"
              >
                Total Geral
              </text>
              <text
                x={CENTER}
                y={CENTER + 26}
                textAnchor="middle"
                className="fill-slate-950 text-xl font-semibold"
                pointerEvents="none"
              >
                {total}
              </text>
            </svg>
          </div>

          <div className="flex max-h-[260px] flex-col justify-center gap-1 overflow-hidden">
            {data.map((item) => (
              <button
                type="button"
                key={item.label}
                className="flex min-w-0 items-center gap-2 text-left text-xs hover:text-[#246b73]"
                onClick={() => onStatusSelect(item.label)}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
