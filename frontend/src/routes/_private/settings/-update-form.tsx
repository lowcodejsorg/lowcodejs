import { FileUploadWithStorage } from '@/components/common/file-upload-with-storage';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { getContext } from '@/integrations/tanstack-query/root-provider';
import { ISetting, IStorage } from '@/lib/interfaces';
import { useUpdateSetting } from '@/tanstack-query/use-setting-update';
import { useForm } from '@tanstack/react-form';
import { AxiosError } from 'axios';
import {
  DatabaseIcon,
  EyeClosedIcon,
  EyeIcon,
  FileTextIcon,
  ImageIcon,
  Languages,
  MailIcon,
  UploadIcon,
} from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

type UpdateSettingFormProps = {
  data: ISetting;
};

export function UpdateSettingForm({ data }: UpdateSettingFormProps) {
  const { queryClient } = getContext();

  const [mode, setMode] = React.useState<'show' | 'edit'>('show');
  const [show, setShow] = React.useState({
    databaseUrl: false,
    emailPassword: false,
  });

  const _update = useUpdateSetting({
    onSuccess(updatedData) {
      queryClient.setQueryData<ISetting>(['/setting'], updatedData);

      toast('Configurações atualizadas', {
        className: '!bg-green-600 !text-white !border-green-600',
        description:
          'As configurações do sistema foram atualizadas com sucesso',
        descriptionClassName: '!text-white',
        closeButton: true,
      });

      form.reset();
      setMode('show');
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data;

        toast('Erro ao atualizar configurações', {
          className: '!bg-destructive !text-white !border-destructive',
          description:
            errorData?.message ?? 'Erro ao atualizar as configurações',
          descriptionClassName: '!text-white',
          closeButton: true,
        });
      }

      console.error(error);
    },
  });

  const form = useForm({
    defaultValues: {
      LOCALE: data.LOCALE,
      LOGO_SMALL_URL: data.LOGO_SMALL_URL,
      LOGO_LARGE_URL: data.LOGO_LARGE_URL,
      FILE_UPLOAD_MAX_SIZE: String(data.FILE_UPLOAD_MAX_SIZE),
      FILE_UPLOAD_MAX_FILES_PER_UPLOAD: String(
        data.FILE_UPLOAD_MAX_FILES_PER_UPLOAD,
      ),
      FILE_UPLOAD_ACCEPTED: data.FILE_UPLOAD_ACCEPTED.join(';'),
      PAGINATION_PER_PAGE: String(data.PAGINATION_PER_PAGE),
      DATABASE_URL: data.DATABASE_URL,
      EMAIL_PROVIDER_HOST: data.EMAIL_PROVIDER_HOST,
      EMAIL_PROVIDER_PORT: String(data.EMAIL_PROVIDER_PORT),
      EMAIL_PROVIDER_USER: data.EMAIL_PROVIDER_USER,
      EMAIL_PROVIDER_PASSWORD: data.EMAIL_PROVIDER_PASSWORD,
      logoSmallFile: [] as File[],
      logoLargeFile: [] as File[],
    },
    onSubmit: async ({ value }) => {
      if (_update.status === 'pending') return;

      const payload = {
        LOCALE: value.LOCALE.trim(),
        LOGO_SMALL_URL: value.LOGO_SMALL_URL,
        LOGO_LARGE_URL: value.LOGO_LARGE_URL,
        FILE_UPLOAD_MAX_SIZE: Number(value.FILE_UPLOAD_MAX_SIZE),
        FILE_UPLOAD_MAX_FILES_PER_UPLOAD: Number(
          value.FILE_UPLOAD_MAX_FILES_PER_UPLOAD,
        ),
        FILE_UPLOAD_ACCEPTED: value.FILE_UPLOAD_ACCEPTED.split(';')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(';'),
        PAGINATION_PER_PAGE: Number(value.PAGINATION_PER_PAGE),
        DATABASE_URL: value.DATABASE_URL.trim(),
        EMAIL_PROVIDER_HOST: value.EMAIL_PROVIDER_HOST.trim(),
        EMAIL_PROVIDER_PORT: Number(value.EMAIL_PROVIDER_PORT),
        EMAIL_PROVIDER_USER: value.EMAIL_PROVIDER_USER.trim(),
        EMAIL_PROVIDER_PASSWORD: value.EMAIL_PROVIDER_PASSWORD.trim(),
      };

      await _update.mutateAsync(payload);
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} bytes`;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <section className="space-y-4 p-2">
        {/* Idioma do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              Idioma do Sistema
            </CardTitle>
            <CardDescription>
              Configure o idioma padrão da aplicação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field
              name="LOCALE"
              validators={{
                onBlur: ({ value }) => {
                  if (!value) {
                    return { message: 'O idioma é obrigatório' };
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Idioma padrão</FieldLabel>
                    <Select
                      disabled={mode === 'show' || _update.status === 'pending'}
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Selecione um idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-br">
                          Português (Brasil)
                        </SelectItem>
                        <SelectItem value="en-us">
                          English (United States)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </CardContent>
        </Card>

        {/* Logos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Logos do Sistema
            </CardTitle>
            <CardDescription>
              Configure os logos exibidos no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo Pequeno */}
              <form.Field
                name="logoSmallFile"
                children={(field) => {
                  return (
                    <Field>
                      <FieldLabel>Logo Pequeno</FieldLabel>
                      {mode === 'edit' && (
                        <FileUploadWithStorage
                          value={field.state.value}
                          onValueChange={field.handleChange}
                          onStorageChange={(storages: IStorage[]) => {
                            if (storages[0]?.url) {
                              form.setFieldValue(
                                'LOGO_SMALL_URL',
                                storages[0].url,
                              );
                            }
                          }}
                          accept="image/*"
                          maxFiles={1}
                          maxSize={4 * 1024 * 1024}
                          placeholder="Arraste ou selecione o logo pequeno"
                          shouldDeleteFromStorage={false}
                        />
                      )}
                      {mode === 'show' && data.LOGO_SMALL_URL && (
                        <div className="mt-2">
                          <img
                            src={data.LOGO_SMALL_URL}
                            alt="Logo pequeno atual"
                            className="h-12 w-auto border rounded"
                          />
                        </div>
                      )}
                    </Field>
                  );
                }}
              />

              {/* Logo Grande */}
              <form.Field
                name="logoLargeFile"
                children={(field) => {
                  return (
                    <Field>
                      <FieldLabel>Logo Grande</FieldLabel>
                      {mode === 'edit' && (
                        <FileUploadWithStorage
                          value={field.state.value}
                          onValueChange={field.handleChange}
                          onStorageChange={(storages: IStorage[]) => {
                            if (storages[0]?.url) {
                              form.setFieldValue(
                                'LOGO_LARGE_URL',
                                storages[0].url,
                              );
                            }
                          }}
                          accept="image/*"
                          maxFiles={1}
                          maxSize={4 * 1024 * 1024}
                          placeholder="Arraste ou selecione o logo grande"
                          shouldDeleteFromStorage={false}
                        />
                      )}
                      {mode === 'show' && data.LOGO_LARGE_URL && (
                        <div className="mt-2">
                          <img
                            src={data.LOGO_LARGE_URL}
                            alt="Logo grande atual"
                            className="h-16 w-auto border rounded"
                          />
                        </div>
                      )}
                    </Field>
                  );
                }}
              />
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
              Configure opções de upload e armazenamento de arquivos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tamanho Máximo */}
              <form.Field
                name="FILE_UPLOAD_MAX_SIZE"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value) {
                      return { message: 'O tamanho máximo é obrigatório' };
                    }
                    const size = Number(value);
                    if (isNaN(size) || size <= 0) {
                      return { message: 'Deve ser um número positivo' };
                    }
                    return undefined;
                  },
                }}
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Tamanho máximo do arquivo
                      </FieldLabel>
                      <div className="text-sm text-muted-foreground mb-2">
                        Tamanho em bytes:{' '}
                        {formatFileSize(Number(field.state.value) || 0)}
                      </div>
                      <InputGroup>
                        <InputGroupInput
                          disabled={
                            mode === 'show' || _update.status === 'pending'
                          }
                          id={field.name}
                          name={field.name}
                          type="number"
                          placeholder="10485760"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                        />
                      </InputGroup>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              {/* Máximo de Arquivos */}
              <form.Field
                name="FILE_UPLOAD_MAX_FILES_PER_UPLOAD"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value) {
                      return {
                        message: 'O número máximo de arquivos é obrigatório',
                      };
                    }
                    const files = Number(value);
                    if (isNaN(files) || files <= 0) {
                      return { message: 'Deve ser um número positivo' };
                    }
                    return undefined;
                  },
                }}
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Máximo de arquivos por upload
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          disabled={
                            mode === 'show' || _update.status === 'pending'
                          }
                          id={field.name}
                          name={field.name}
                          type="number"
                          placeholder="5"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                        />
                      </InputGroup>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
            </div>

            {/* Tipos Aceitos */}
            <form.Field
              name="FILE_UPLOAD_ACCEPTED"
              validators={{
                onBlur: ({ value }) => {
                  if (!value || value.trim() === '') {
                    return {
                      message: 'Os tipos de arquivo aceitos são obrigatórios',
                    };
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Tipos de arquivo aceitos
                    </FieldLabel>
                    <div className="text-sm text-muted-foreground mb-2">
                      Liste as extensões separadas por ponto-e-vírgula (ex:
                      pdf;jpg;png)
                    </div>
                    <InputGroup>
                      <InputGroupInput
                        disabled={
                          mode === 'show' || _update.status === 'pending'
                        }
                        id={field.name}
                        name={field.name}
                        type="text"
                        placeholder="pdf;csv;png;jpeg;jpg;webp"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                    </InputGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </CardContent>
        </Card>

        {/* Paginação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="w-5 h-5" />
              Paginação
            </CardTitle>
            <CardDescription>
              Configure opções de paginação do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field
              name="PAGINATION_PER_PAGE"
              validators={{
                onBlur: ({ value }) => {
                  if (!value) {
                    return {
                      message: 'O número de itens por página é obrigatório',
                    };
                  }
                  const pages = Number(value);
                  if (isNaN(pages) || pages <= 0) {
                    return { message: 'Deve ser um número positivo' };
                  }
                  if (pages > 500) {
                    return {
                      message: 'O número máximo de itens por página é 500',
                    };
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Itens por página
                    </FieldLabel>
                    <div className="text-sm text-muted-foreground mb-2">
                      Número padrão de itens exibidos por página nas listagens
                    </div>
                    <Select
                      disabled={mode === 'show' || _update.status === 'pending'}
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="40">40</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </CardContent>
        </Card>

        {/* Banco de Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="w-5 h-5" />
              Banco de Dados
            </CardTitle>
            <CardDescription>
              Configure a conexão com o banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field
              name="DATABASE_URL"
              validators={{
                onBlur: ({ value }) => {
                  if (!value) {
                    return { message: 'A URL do banco de dados é obrigatória' };
                  }
                  if (
                    !value.startsWith('mongodb://') &&
                    !value.startsWith('mongodb+srv://')
                  ) {
                    return {
                      message:
                        'A URL deve começar com mongodb:// ou mongodb+srv://',
                    };
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Database URL</FieldLabel>
                    <div className="text-sm text-muted-foreground mb-2">
                      String de conexão do MongoDB
                    </div>
                    <InputGroup>
                      <InputGroupInput
                        disabled={
                          mode === 'show' || _update.status === 'pending'
                        }
                        id={field.name}
                        name={field.name}
                        type={show.databaseUrl ? 'text' : 'password'}
                        placeholder="mongodb://localhost:27017/lowcodejs"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          disabled={
                            mode === 'show' || _update.status === 'pending'
                          }
                          type="button"
                          aria-label="toggle password visibility"
                          title="toggle password visibility"
                          onClick={() =>
                            setShow((state) => ({
                              ...state,
                              databaseUrl: !state.databaseUrl,
                            }))
                          }
                        >
                          {show.databaseUrl && <EyeClosedIcon />}
                          {!show.databaseUrl && <EyeIcon />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </CardContent>
        </Card>

        {/* Servidor de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailIcon className="w-5 h-5" />
              Servidor de Email
            </CardTitle>
            <CardDescription>
              Configure o servidor de email para notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Host */}
              <form.Field
                name="EMAIL_PROVIDER_HOST"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value) {
                      return { message: 'O host é obrigatório' };
                    }
                    return undefined;
                  },
                }}
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>SMTP Host</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          disabled={
                            mode === 'show' || _update.status === 'pending'
                          }
                          id={field.name}
                          name={field.name}
                          type="text"
                          placeholder="smtp.gmail.com"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                        />
                      </InputGroup>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              {/* Port */}
              <form.Field
                name="EMAIL_PROVIDER_PORT"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value) {
                      return { message: 'A porta é obrigatória' };
                    }
                    const port = Number(value);
                    if (isNaN(port) || port <= 0 || port > 65535) {
                      return {
                        message: 'A porta deve ser um número entre 1 e 65535',
                      };
                    }
                    return undefined;
                  },
                }}
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>SMTP Port</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          disabled={
                            mode === 'show' || _update.status === 'pending'
                          }
                          id={field.name}
                          name={field.name}
                          type="number"
                          placeholder="587"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                        />
                      </InputGroup>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
            </div>

            {/* User */}
            <form.Field
              name="EMAIL_PROVIDER_USER"
              // validators={{
              //   onBlur: ({ value }) => {
              //     if (!value) {
              //       return { message: 'O usuário de email é obrigatório' };
              //     }
              //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              //     if (!emailRegex.test(value)) {
              //       return { message: 'Digite um email válido' };
              //     }
              //     return undefined;
              //   },
              // }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email Username</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        disabled={
                          mode === 'show' || _update.status === 'pending'
                        }
                        id={field.name}
                        name={field.name}
                        // type="email"
                        placeholder="user@example.com"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                    </InputGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            {/* Password */}
            <form.Field
              name="EMAIL_PROVIDER_PASSWORD"
              validators={{
                onBlur: ({ value }) => {
                  if (!value) {
                    return { message: 'A senha é obrigatória' };
                  }
                  if (value.length < 6) {
                    return {
                      message: 'A senha deve ter pelo menos 6 caracteres',
                    };
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email Password</FieldLabel>
                    <div className="text-sm text-muted-foreground mb-2">
                      Senha ou API key para autenticação de email
                    </div>
                    <InputGroup>
                      <InputGroupInput
                        disabled={
                          mode === 'show' || _update.status === 'pending'
                        }
                        id={field.name}
                        name={field.name}
                        type={show.emailPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          disabled={
                            mode === 'show' || _update.status === 'pending'
                          }
                          type="button"
                          aria-label="toggle password visibility"
                          title="toggle password visibility"
                          onClick={() =>
                            setShow((state) => ({
                              ...state,
                              emailPassword: !state.emailPassword,
                            }))
                          }
                        >
                          {show.emailPassword && <EyeClosedIcon />}
                          {!show.emailPassword && <EyeIcon />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </CardContent>
        </Card>

        {/* Botões */}
        <Field className="inline-flex justify-end flex-1 items-end">
          {mode === 'show' && (
            <Button
              type="button"
              className="w-full max-w-3xs"
              onClick={() => {
                setMode('edit');
              }}
            >
              <span>Editar</span>
            </Button>
          )}

          {mode === 'edit' && (
            <div className="inline-flex space-x-2 items-end justify-end">
              <Button
                type="reset"
                variant="outline"
                className="w-full max-w-3xs"
                disabled={_update.status === 'pending'}
                onClick={() => {
                  form.reset();
                  setMode('show');
                }}
              >
                <span>Cancelar</span>
              </Button>
              <Button
                type="submit"
                className="w-full max-w-3xs"
                disabled={_update.status === 'pending'}
              >
                {_update.status === 'pending' && <Spinner />}
                <span>Salvar</span>
              </Button>
            </div>
          )}
        </Field>
      </section>
    </form>
  );
}
