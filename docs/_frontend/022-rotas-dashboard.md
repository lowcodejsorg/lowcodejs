# Dashboard

Documentacao da rota de dashboard do LowCodeJS, que apresenta uma visao geral do sistema com cards de estatisticas, graficos e atividades recentes.

**Diretorio fonte:** `frontend/src/routes/_private/dashboard/`

---

## Visao Geral

O dashboard e a pagina principal apos login, composta por:

- **4 cards de estatisticas** (Total de Tabelas, Total de Usuarios, Total de Registros, Usuarios Ativos)
- **2 graficos** (Tabelas criadas por mes, Usuarios por status)
- **Lista de atividades recentes**

Atualmente, os dados sao servidos por **mock data** (dados simulados), preparados para futura integracao com a API real.

---

## Arquivos do Modulo

| Arquivo                | Descricao                                    |
|-----------------------|----------------------------------------------|
| `index.tsx`           | Componente principal da rota do dashboard     |
| `-stat-card.tsx`      | Card reutilizavel de estatisticas             |
| `-chart-tables.tsx`   | Grafico de barras - tabelas criadas por mes   |
| `-chart-users.tsx`    | Grafico de pizza - usuarios por status        |
| `-recent-activity.tsx`| Lista de atividades recentes                  |
| `-mock-data.ts`       | Dados simulados para todos os componentes     |

> **Nota:** Arquivos prefixados com `-` sao componentes privados da rota (convencao do TanStack Router).

---

## Rota Principal (`index.tsx`)

Registrada como `/_private/dashboard/`:

```tsx
export const Route = createFileRoute('/_private/dashboard/')({
  component: RouteComponent,
});
```

### Layout em Grid

O dashboard utiliza um layout responsivo em grid:

```tsx
<div className="flex flex-col h-full overflow-hidden">
  {/* Cabecalho */}
  <div className="shrink-0 p-4 border-b">
    <h1 className="text-2xl font-semibold">Dashboard</h1>
  </div>

  <div className="flex-1 overflow-auto p-4 space-y-4">
    {/* Linha 1: 4 stat cards em grid responsivo */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total de Tabelas" value={mockStats.totalTables} icon={Table} />
      <StatCard title="Total de Usuarios" value={mockStats.totalUsers} icon={Users} />
      <StatCard title="Total de Registros" value={mockStats.totalRecords} icon={FileText} />
      <StatCard
        title="Usuarios Ativos"
        value={mockStats.activeUsers}
        icon={UserCheck}
        description={`${Math.round((mockStats.activeUsers / mockStats.totalUsers) * 100)}% do total`}
      />
    </div>

    {/* Linha 2: 2 graficos lado a lado */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartTables />
      <ChartUsers />
    </div>

    {/* Linha 3: atividades recentes */}
    <RecentActivity />
  </div>
</div>
```

### Responsividade do Grid

| Breakpoint | Stat Cards | Graficos    |
|-----------|------------|-------------|
| Mobile    | 1 coluna   | 1 coluna    |
| `md`      | 2 colunas  | 1 coluna    |
| `lg`      | 4 colunas  | 2 colunas   |

---

## Componente StatCard (`-stat-card.tsx`)

Card reutilizavel para exibir uma metrica com icone.

### Interface

```tsx
interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
}
```

### Exemplo de Uso

```tsx
<StatCard
  title="Total de Tabelas"
  value={12}
  icon={Table}
/>

<StatCard
  title="Usuarios Ativos"
  value={38}
  icon={UserCheck}
  description="84% do total"
/>
```

### Detalhes de Implementacao

- O valor numerico e formatado com `toLocaleString('pt-BR')` para localizacao brasileira
- O `description` e opcional e aparece como texto auxiliar abaixo do valor
- Utiliza componentes `Card`, `CardHeader` e `CardContent` da UI library

---

## Grafico de Tabelas (`-chart-tables.tsx`)

Grafico de **barras verticais** usando Recharts que mostra tabelas criadas por mes.

```tsx
const chartConfig = {
  tables: {
    label: 'Tabelas',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;
```

### Estrutura do Grafico

```tsx
<Card>
  <CardHeader>
    <CardTitle>Tabelas Criadas por Mes</CardTitle>
  </CardHeader>
  <CardContent>
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={mockTablesPerMonth} accessibilityLayer>
        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
        <YAxis tickLine={false} tickMargin={10} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="tables" fill="var(--chart-1)" radius={4} />
      </BarChart>
    </ChartContainer>
  </CardContent>
</Card>
```

### Dados Mock

```tsx
export const mockTablesPerMonth = [
  { month: 'Ago', tables: 2 },
  { month: 'Set', tables: 3 },
  { month: 'Out', tables: 1 },
  { month: 'Nov', tables: 4 },
  { month: 'Dez', tables: 2 },
  { month: 'Jan', tables: 3 },
];
```

---

## Grafico de Usuarios (`-chart-users.tsx`)

Grafico de **pizza (donut)** usando Recharts que mostra a distribuicao de usuarios por status.

```tsx
const chartConfig = {
  value: { label: 'Usuarios' },
  Ativos: { label: 'Ativos', color: 'var(--chart-1)' },
  Inativos: { label: 'Inativos', color: 'var(--chart-2)' },
} satisfies ChartConfig;
```

### Estrutura do Grafico

```tsx
<PieChart accessibilityLayer>
  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
  <Pie
    data={mockUsersByStatus}
    dataKey="value"
    nameKey="status"
    innerRadius={50}
    strokeWidth={5}
  />
  <ChartLegend
    content={<ChartLegendContent nameKey="status" />}
    className="-translate-y-2 flex-wrap gap-2 [&>*]:justify-center"
  />
</PieChart>
```

### Dados Mock

```tsx
export const mockUsersByStatus = [
  { status: 'Ativos', value: 38, fill: 'var(--chart-1)' },
  { status: 'Inativos', value: 7, fill: 'var(--chart-2)' },
];
```

O `innerRadius={50}` cria o efeito de grafico donut (anel), diferente de um pie chart completo.

---

## Atividades Recentes (`-recent-activity.tsx`)

Lista as ultimas atividades do sistema com icones contextuais.

### Mapeamento de Icones

```tsx
const iconMap: Record<string, typeof Table> = {
  table_created: Table,
  table_updated: Pencil,
  user_created: Users,
  record_created: FileText,
};
```

| Tipo de Atividade   | Icone       | Exemplo                              |
|--------------------|-------------|--------------------------------------|
| `table_created`    | `Table`     | Tabela "Clientes" criada             |
| `table_updated`    | `Pencil`    | Tabela "Pedidos" atualizada          |
| `user_created`     | `Users`     | Usuario "Joao Silva" cadastrado      |
| `record_created`   | `FileText`  | 15 registros adicionados em "Produtos"|

### Estrutura de Cada Atividade

```tsx
{
  id: '1',
  type: 'table_created',
  description: 'Tabela "Clientes" criada',
  time: 'ha 2 horas',
}
```

Cada atividade e renderizada com um icone circular, a descricao e o tempo relativo.

---

## Dados Mock (`-mock-data.ts`)

Arquivo central com todos os dados simulados:

```tsx
export const mockStats = {
  totalTables: 12,
  totalUsers: 45,
  totalRecords: 1234,
  activeUsers: 38,
};
```

| Constante            | Tipo                | Usado por          |
|---------------------|---------------------|-------------------|
| `mockStats`         | Objeto de metricas  | `StatCard`        |
| `mockTablesPerMonth`| Array de dados      | `ChartTables`     |
| `mockUsersByStatus` | Array de dados      | `ChartUsers`      |
| `mockRecentActivity`| Array de atividades | `RecentActivity`  |

---

## Dependencias

| Dependencia   | Uso                                               |
|--------------|---------------------------------------------------|
| `recharts`   | Graficos (BarChart, PieChart, XAxis, YAxis, etc.) |
| `lucide-react` | Icones (Table, Users, FileText, UserCheck, Pencil) |
| `@/components/ui/card` | Cards para layout                         |
| `@/components/ui/chart` | Wrapper de graficos (ChartContainer, ChartTooltip) |
