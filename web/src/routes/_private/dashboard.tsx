import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/hooks/i18.hook";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpIcon, DatabaseIcon, TableIcon, UserIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_private/dashboard")({
  component: RouteComponent,
});
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

function RouteComponent() {
  const { t } = useI18n();

  const databaseActivity = [
    { name: t("DASHBOARD_DAY_MON", "Mon"), queries: 400 },
    { name: t("DASHBOARD_DAY_TUE", "Tue"), queries: 300 },
    { name: t("DASHBOARD_DAY_WED", "Wed"), queries: 500 },
    { name: t("DASHBOARD_DAY_THU", "Thu"), queries: 280 },
    { name: t("DASHBOARD_DAY_FRI", "Fri"), queries: 590 },
    { name: t("DASHBOARD_DAY_SAT", "Sat"), queries: 190 },
    { name: t("DASHBOARD_DAY_SUN", "Sun"), queries: 90 },
  ];

  const tableDistribution = [
    { name: t("DASHBOARD_CATEGORY_PRODUCTS", "Products"), value: 35 },
    { name: t("DASHBOARD_CATEGORY_USERS", "Users"), value: 25 },
    { name: t("DASHBOARD_CATEGORY_SALES", "Sales"), value: 20 },
    { name: t("DASHBOARD_CATEGORY_REPORTS", "Reports"), value: 20 },
  ];

  return (
    <div className="flex-1 w-full p-10 flex flex-col gap-4 overflow-y-auto h-auto">
      <h1 className="text-3xl font-bold mb-6">{t("DASHBOARD_PAGE_TITLE", "Dashboard")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("DASHBOARD_DATABASE_COUNT_TITLE", "Databases")}
              </CardTitle>
              <CardDescription className="text-2xl font-bold">
                12
              </CardDescription>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <DatabaseIcon className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center">
              <ArrowUpIcon className="size-4 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">12%</span> {t("DASHBOARD_GROWTH_FROM_LAST_MONTH", "from last month")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("DASHBOARD_TABLES_COUNT_TITLE", "Total Tables")}
              </CardTitle>
              <CardDescription className="text-2xl font-bold">
                342
              </CardDescription>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <TableIcon className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center">
              <ArrowUpIcon className="size-4 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">8%</span> {t("DASHBOARD_GROWTH_FROM_LAST_MONTH", "from last month")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("DASHBOARD_ACTIVE_USERS_TITLE", "Active Users")}
              </CardTitle>
              <CardDescription className="text-2xl font-bold">
                56
              </CardDescription>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <UserIcon className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center">
              <ArrowUpIcon className="size-4 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">24%</span> {t("DASHBOARD_GROWTH_FROM_LAST_MONTH", "from last month")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t("DASHBOARD_DATABASE_ACTIVITY_TITLE", "Database Activity")}</CardTitle>
            <CardDescription>
              {t("DASHBOARD_DATABASE_ACTIVITY_DESCRIPTION", "Number of queries per day in the last week")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={databaseActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="queries" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t("DASHBOARD_TABLE_DISTRIBUTION_TITLE", "Table Distribution")}</CardTitle>
            <CardDescription>{t("DASHBOARD_TABLE_DISTRIBUTION_DESCRIPTION", "By data type")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tableDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tableDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
