export function normalizeCode(code: string): string {
  let normalized = code;

  // 1. Preservar template literals (evitar quebrar `${variavel}`)
  const templateLiterals: string[] = [];
  let templateIndex = 0;

  // Identificar e substituir template literals por placeholders temporários
  normalized = normalized.replace(/`[^`]*`/g, (match) => {
    const placeholder = `__TEMPLATE_LITERAL_${templateIndex++}__`;
    templateLiterals.push(match);
    return placeholder;
  });

  // 2. Preservar strings com aspas duplas e simples
  const stringLiterals: string[] = [];
  let stringIndex = 0;

  // Strings com aspas duplas
  normalized = normalized.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
    const placeholder = `__STRING_LITERAL_${stringIndex++}__`;
    stringLiterals.push(match);
    return placeholder;
  });

  // Strings com aspas simples
  normalized = normalized.replace(/'(?:[^'\\]|\\.)*'/g, (match) => {
    const placeholder = `__STRING_LITERAL_${stringIndex++}__`;
    stringLiterals.push(match);
    return placeholder;
  });

  // 3. Preservar expressões regulares
  const regexLiterals: string[] = [];
  let regexIndex = 0;

  normalized = normalized.replace(
    /\/(?:[^/\\\n]|\\.)+\/[gimsuvy]*/g,
    (match) => {
      const placeholder = `__REGEX_LITERAL_${regexIndex++}__`;
      regexLiterals.push(match);
      return placeholder;
    },
  );

  // 4. Preservar comentários
  const comments: string[] = [];
  let commentIndex = 0;

  // Comentários de linha
  normalized = normalized.replace(/\/\/.*$/gm, (match) => {
    const placeholder = `__COMMENT_${commentIndex++}__`;
    comments.push(match);
    return placeholder;
  });

  // Comentários de bloco
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    const placeholder = `__COMMENT_${commentIndex++}__`;
    comments.push(match);
    return placeholder;
  });

  // 5. Normalizar pontuação e formatação
  const lines = normalized.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmedLine = line.trim();
    const nextLine = lines[lineIndex + 1];
    const nextTrimmedLine = nextLine ? nextLine.trim() : '';

    // Ignora linhas vazias ou só com placeholders de comentários
    if (!trimmedLine || trimmedLine.match(/^__COMMENT_\d+__$/)) {
      continue;
    }

    // CORREÇÃO 1: Detectar method chaining, operadores ECMA e função multiline
    // Se próxima linha começa com '.', '?.', '??', '||', '&&', '?', ':', '[', não adicionar ponto e vírgula
    const isMethodChaining =
      nextTrimmedLine.startsWith('.') ||
      nextTrimmedLine.startsWith('?.') ||
      nextTrimmedLine.startsWith('??') ||
      nextTrimmedLine.startsWith('||') ||
      nextTrimmedLine.startsWith('&&') ||
      nextTrimmedLine.startsWith('?') ||
      nextTrimmedLine.startsWith(':') ||
      nextTrimmedLine.startsWith('[') || // arrays multiline
      nextTrimmedLine.startsWith('"') || // strings multiline
      nextTrimmedLine.startsWith("'") || // strings multiline
      (trimmedLine.endsWith('(') && !trimmedLine.includes(')')) || // função não fechada
      (trimmedLine.includes('(') &&
        !trimmedLine.includes(')') &&
        trimmedLine.split('(').length > trimmedLine.split(')').length); // parênteses não balanceados

    // CORREÇÃO 2: Detectar linha que é continuação de method chaining ou operadores
    const isContinuationLine =
      trimmedLine.startsWith('.') ||
      trimmedLine.startsWith('?.') ||
      trimmedLine.startsWith('??') ||
      trimmedLine.startsWith('||') ||
      trimmedLine.startsWith('&&') ||
      (trimmedLine.startsWith('?') && !trimmedLine.includes(':')) ||
      (trimmedLine.startsWith(':') &&
        lines[lineIndex - 1] &&
        lines[lineIndex - 1].trim().includes('?')) ||
      trimmedLine.startsWith('[') || // arrays multiline
      trimmedLine.startsWith(']') || // fechamento array
      trimmedLine.startsWith('"') || // strings multiline
      trimmedLine.startsWith("'") || // strings multiline
      trimmedLine.startsWith(')') || // fechamento de função
      (lines[lineIndex - 1] &&
        lines[lineIndex - 1].includes('(') &&
        !lines[lineIndex - 1].includes(')') &&
        lines[lineIndex - 1].split('(').length >
          lines[lineIndex - 1].split(')').length); // linha anterior tem função não fechada

    // Linhas que não precisam de ponto e vírgula
    if (
      trimmedLine.endsWith(';') ||
      trimmedLine.endsWith('{') ||
      trimmedLine.endsWith('}') ||
      trimmedLine.startsWith('if ') ||
      trimmedLine.startsWith('else') ||
      trimmedLine.startsWith('for ') ||
      trimmedLine.startsWith('while ') ||
      trimmedLine.startsWith('switch ') ||
      trimmedLine.startsWith('function ') ||
      trimmedLine.startsWith('async function ') ||
      (trimmedLine.startsWith('const ') && trimmedLine.includes('=>')) ||
      (trimmedLine.startsWith('let ') && trimmedLine.includes('=>')) ||
      (trimmedLine.startsWith('var ') && trimmedLine.includes('=>')) ||
      trimmedLine.match(/^\s*\}/) ||
      trimmedLine.match(/^case\s+/) ||
      trimmedLine.match(/^default\s*:/) ||
      isMethodChaining ||
      isContinuationLine
    ) {
      continue;
    }

    // Linhas que precisam de ponto e vírgula (apenas se for linha completa)
    const shouldAddSemicolon =
      !isMethodChaining &&
      !isContinuationLine &&
      (trimmedLine.includes('console.') ||
        trimmedLine.includes('return ') ||
        (trimmedLine.includes('=') && !trimmedLine.includes('=>')) ||
        trimmedLine.includes('await ') ||
        trimmedLine.includes('throw ') ||
        trimmedLine.includes('break') ||
        trimmedLine.includes('continue') ||
        // Função completa em uma linha (tem parênteses balanceados)
        ((trimmedLine.includes('setFieldValue(') ||
          trimmedLine.includes('getFieldValue(') ||
          trimmedLine.includes('sendEmail(')) &&
          trimmedLine.split('(').length === trimmedLine.split(')').length &&
          trimmedLine.includes(')')));

    if (shouldAddSemicolon && !line.trim().endsWith(';')) {
      lines[lineIndex] = line + ';';
    }
  }

  normalized = lines.join('\n');

  // 6. Restaurar literais preservados na ordem correta
  // CORREÇÃO 3: Usar replaceAll para garantir substituição de todos os placeholders

  // Restaurar comentários primeiro
  for (const [index, comment] of comments.entries()) {
    const placeholder = `__COMMENT_${index}__`;
    normalized = normalized.replaceAll(placeholder, comment);
  }

  // Restaurar regex
  for (const [index, regex] of regexLiterals.entries()) {
    const placeholder = `__REGEX_LITERAL_${index}__`;
    normalized = normalized.replaceAll(placeholder, regex);
  }

  // Restaurar strings (CRÍTICO: deve ser após comentários e regex)
  for (const [index, str] of stringLiterals.entries()) {
    const placeholder = `__STRING_LITERAL_${index}__`;
    normalized = normalized.replaceAll(placeholder, str);
  }

  // Restaurar template literals por último
  for (const [index, template] of templateLiterals.entries()) {
    const placeholder = `__TEMPLATE_LITERAL_${index}__`;
    normalized = normalized.replaceAll(placeholder, template);
  }

  return normalized;
}
