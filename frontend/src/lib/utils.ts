import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Category, Meta, Storage } from "./entity";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MetaDefault: Meta = {
  total: 1,
  perPage: 50,
  page: 1,
  lastPage: 1,
  firstPage: 1,
};

export function getCategoryItem(
  category: Category[],
  id: string
): Category | null {
  for (const item of category) {
    if (item.id === id) {
      return item;
    }

    if (item.children && item.children.length > 0) {
      const r = getCategoryItem(item.children, id);
      if (r) {
        return r;
      }
    }
  }

  return null;
}

export function enabledMenuOfGroup(route: string) {
  const groups: Record<string, string[]> = {
    "/dashboard": ["master", "administrator", "manager"],
    "/tables": ["master", "administrator", "manager", "registered"],
    "/menu-management": ["master", "administrator"],
    "/users": ["master", "administrator"],
    "/user-groups": ["master"],
    "/settings": ["master"],
  };

  return groups[route] || [];
}

export function enabledMenu(route?: string, grupo?: string): boolean {
  if (!route || !grupo) return false;
  const routes = enabledMenuOfGroup(route);
  return routes.includes(grupo);
}

export function storageToFile(storage: Storage): File {
  // const response = await fetch(storage.url);
  // const blob = await response.blob();
  // return new File([blob], storage.name, { type: storage.type });
  const blob = new Blob([""], { type: storage.type });

  return new File([blob], storage.filename || "arquivo.png", {
    type: storage.type,
    lastModified: new Date().getTime(),
  });
}

export function getFileType({ type, filename }: Storage) {
  if (type) {
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.startsWith("audio/")) return "audio";
    if (type.startsWith("application/pdf")) return "pdf";
    if (type.includes("zip") || type.includes("tar") || type.includes("rar"))
      return "archive";
    if (type.includes("text/html") || type.includes("application/javascript"))
      return "code";
  }

  // Fallback to extension check
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) return "text";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(extension))
    return "image";
  if (["mp4", "webm", "mov", "avi", "wmv", "flv", "mkv"].includes(extension))
    return "video";
  if (["mp3", "wav", "ogg", "flac", "aac"].includes(extension)) return "audio";
  if (extension === "pdf") return "pdf";
  if (["zip", "rar", "tar", "7z", "gz"].includes(extension)) return "archive";
  if (
    [
      "html",
      "css",
      "js",
      "ts",
      "jsx",
      "tsx",
      "php",
      "py",
      "java",
      "rb",
      "c",
      "cpp",
    ].includes(extension)
  )
    return "code";

  return "text";
}

// Função para gerar código exemplo dinâmico para beforeSave
export const generateBeforeSaveCode = (
  fieldPlaceholders: Record<string, unknown>
) => {
  const placeholderKeys = Object.keys(fieldPlaceholders);
  const firstField = placeholderKeys[0] || "$tabela_campo";
  const secondField = placeholderKeys[1] || "$tabela_outro_campo";

  return `// BEFORE SAVE: Executa ANTES de salvar o registro
// Placeholders disponíveis: ${placeholderKeys.join(", ")}

// Exemplo 1: Validação customizada
if (userAction === 'novo_registro' || userAction === 'editar_registro') {
  // Validar campos obrigatórios
  if (!${firstField}) {
    throw new Error('Campo obrigatório não preenchido');
  }

  // Cálculos antes de salvar
  ${
    placeholderKeys.length > 1
      ? `if (typeof ${firstField} === 'number' && typeof ${secondField} === 'number') {
    const total = ${firstField} + ${secondField};
    console.log('Total calculado:', total);
  }`
      : `console.log('Processando:', ${firstField});`
  }
}

// Exemplo 2: Modificar dados antes de salvar
if (userAction === 'editar_registro' && executionMoment === 'antes_salvar') {
  // setFieldValue('campo_id', 'novo_valor');
  console.log('Dados processados antes de salvar');
}`;
};

// Função para gerar código exemplo dinâmico para afterSave
export const generateAfterSaveCode = (
  fieldPlaceholders: Record<string, unknown>
) => {
  const placeholderKeys = Object.keys(fieldPlaceholders);
  const firstField = placeholderKeys[0] || "$tabela_campo";

  return `// AFTER SAVE: Executa DEPOIS de salvar o registro
// Placeholders disponíveis: ${placeholderKeys.join(", ")}

// Exemplo 1: Envio de notificações
if (userAction === 'novo_registro' && executionMoment === 'depois_salvar') {
  sendEmail(
    ['admin@empresa.com'],
    'Novo registro criado',
    \`Registro criado com valor: \${${firstField}}\`
  );
}

// Exemplo 2: Integração com outros sistemas
if (userAction === 'editar_registro' && executionMoment === 'depois_salvar') {
  // Chamar API externa, webhook, etc.
  console.log('Registro atualizado:', ${firstField});

  // fetch('https://api.externa.com/webhook', {
  //   method: 'POST',
  //   body: JSON.stringify({ data: ${firstField} })
  // });
}

// Exemplo 3: Log de auditoria
console.log('Ação completada:', userAction, 'em', new Date().toISOString());`;
};

export const generateOnLoadCode = (
  fieldPlaceholders: Record<string, unknown>
) => {
  const placeholderKeys = Object.keys(fieldPlaceholders);
  const firstField = placeholderKeys[0] || "$tabela_campo";
  const secondField = placeholderKeys[1] || "$tabela_outro_campo";
  return `// ON LOAD: Executa quando o formulário carrega
// Placeholders disponíveis: ${placeholderKeys.join(", ")}
// Variáveis globais: userAction, executionMoment, userId, tableId

// Exemplo 1: Configuração inicial do formulário
if (executionMoment === 'carregamento_formulario') {
  // Pré-preencher campos baseado em regras de negócio
  if (!${firstField}) {
    setFieldValue('${firstField.replace("$", "")}', 'Valor padrão');
  }

  // Configurar visibilidade de campos
  console.log('Formulário carregado para usuário:', userId);
}

// Exemplo 2: Cálculos automáticos no carregamento
if (${firstField} && ${secondField}) {
  const resultado = parseFloat(${firstField}) + parseFloat(${secondField});
  console.log('Cálculo inicial:', resultado);
}

// Exemplo 3: Validações customizadas
console.log('Carregamento concluído em:', new Date().toISOString());`;
};
