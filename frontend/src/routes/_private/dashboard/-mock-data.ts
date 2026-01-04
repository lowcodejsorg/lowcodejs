export const mockStats = {
  totalTables: 12,
  totalUsers: 45,
  totalRecords: 1234,
  activeUsers: 38,
};

export const mockTablesPerMonth = [
  { month: 'Ago', tables: 2 },
  { month: 'Set', tables: 3 },
  { month: 'Out', tables: 1 },
  { month: 'Nov', tables: 4 },
  { month: 'Dez', tables: 2 },
  { month: 'Jan', tables: 3 },
];

export const mockUsersByStatus = [
  { status: 'Ativos', value: 38, fill: 'var(--chart-1)' },
  { status: 'Inativos', value: 7, fill: 'var(--chart-2)' },
];

export const mockRecentActivity = [
  {
    id: '1',
    type: 'table_created',
    description: 'Tabela "Clientes" criada',
    time: 'há 2 horas',
  },
  {
    id: '2',
    type: 'user_created',
    description: 'Usuário "João Silva" cadastrado',
    time: 'há 5 horas',
  },
  {
    id: '3',
    type: 'record_created',
    description: '15 registros adicionados em "Produtos"',
    time: 'há 1 dia',
  },
  {
    id: '4',
    type: 'table_updated',
    description: 'Tabela "Pedidos" atualizada',
    time: 'há 2 dias',
  },
  {
    id: '5',
    type: 'user_created',
    description: 'Usuário "Maria Santos" cadastrado',
    time: 'há 3 dias',
  },
];
