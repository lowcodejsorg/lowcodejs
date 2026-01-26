import {
  DatabaseIcon,
  FileTextIcon,
  ImageIcon,
  Languages,
  MailIcon,
  UploadIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ISetting } from '@/lib/interfaces';

interface SettingViewProps {
  data: ISetting;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1048576) {
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} bytes`;
}

function getLocaleLabel(locale: string): string {
  switch (locale) {
    case 'pt-br':
      return 'Português (Brasil)';
    case 'en-us':
      return 'English (United States)';
    default:
      return locale;
  }
}

export function SettingView({ data }: SettingViewProps): React.JSX.Element {
  return (
    <section className="space-y-4 p-2">
      {/* Idioma do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Idioma do Sistema
          </CardTitle>
          <CardDescription>
            Configuração do idioma padrão da aplicação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-sm font-medium">Idioma padrão</p>
            <p className="text-sm text-muted-foreground">
              {getLocaleLabel(data.LOCALE)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Logos do Sistema
          </CardTitle>
          <CardDescription>Logos exibidos no sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Logo Pequeno</p>
              {data.LOGO_SMALL_URL ? (
                <img
                  src={data.LOGO_SMALL_URL}
                  alt="Logo pequeno"
                  className="h-12 w-auto border rounded"
                />
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Logo Grande</p>
              {data.LOGO_LARGE_URL ? (
                <img
                  src={data.LOGO_LARGE_URL}
                  alt="Logo grande"
                  className="h-16 w-auto border rounded"
                />
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload de Arquivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadIcon className="w-5 h-5" />
            Configurações de Upload
          </CardTitle>
          <CardDescription>
            Opções de upload e armazenamento de arquivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Tamanho máximo do arquivo</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(data.FILE_UPLOAD_MAX_SIZE)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Máximo de arquivos por upload
              </p>
              <p className="text-sm text-muted-foreground">
                {data.FILE_UPLOAD_MAX_FILES_PER_UPLOAD}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Tipos de arquivo aceitos</p>
            <p className="text-sm text-muted-foreground">
              {data.FILE_UPLOAD_ACCEPTED.join('; ')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Paginação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="w-5 h-5" />
            Paginação
          </CardTitle>
          <CardDescription>Opções de paginação do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-sm font-medium">Itens por página</p>
            <p className="text-sm text-muted-foreground">
              {data.PAGINATION_PER_PAGE}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modelo de Tabelas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5" />
            Modelo de Tabelas
          </CardTitle>
          <CardDescription>
            Tabelas permitidas para clonagem de modelos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-sm font-medium">Tabelas selecionadas</p>
            {data.MODEL_CLONE_TABLES.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {data.MODEL_CLONE_TABLES.map((table) => (
                  <Badge
                    key={table._id}
                    variant="secondary"
                  >
                    {table.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Banco de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5" />
            Banco de Dados
          </CardTitle>
          <CardDescription>Conexão com o banco de dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-sm font-medium">Database URL</p>
            <p className="text-sm text-muted-foreground font-mono">
              {data.DATABASE_URL ? '••••••••••••••••' : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Servidor de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailIcon className="w-5 h-5" />
            Servidor de Email
          </CardTitle>
          <CardDescription>Servidor de email para notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">SMTP Host</p>
              <p className="text-sm text-muted-foreground">
                {data.EMAIL_PROVIDER_HOST || '-'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">SMTP Port</p>
              <p className="text-sm text-muted-foreground">
                {data.EMAIL_PROVIDER_PORT}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Email Username</p>
            <p className="text-sm text-muted-foreground">
              {data.EMAIL_PROVIDER_USER || '-'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Email Password</p>
            <p className="text-sm text-muted-foreground">
              {data.EMAIL_PROVIDER_PASSWORD ? '••••••••' : '-'}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
