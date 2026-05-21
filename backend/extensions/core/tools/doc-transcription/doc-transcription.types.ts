export interface IDocResponseField {
  key: string;
  label: string;
  type: 'string' | 'date' | 'number' | 'boolean';
}

export interface IDocumentType {
  id: string;
  name: string;
  description: string | null;
  responseFields: IDocResponseField[];
}

export interface IDocTranscriptionConfig {
  apiUrl: string | null;
  apiKey: string | null;
  model: string | null;
  documentTypes: IDocumentType[];
}

export interface ITranscribeResult {
  documentTypeId: string;
  documentTypeName: string;
  fields: Array<{
    key: string;
    label: string;
    type: IDocResponseField['type'];
    value: string | number | boolean | null;
  }>;
  raw: unknown;
}
