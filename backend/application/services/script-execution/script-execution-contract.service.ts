/* eslint-disable no-unused-vars */
import type {
  ExecutionContext,
  ExecutionResult,
  FieldDefinition,
} from '@application/core/table/types';

export type ScriptExecutionInput = {
  code: string;
  doc: Record<string, any>;
  tableSlug: string;
  fields: FieldDefinition[];
  context: ExecutionContext;
};

export abstract class ScriptExecutionContractService {
  abstract execute(input: ScriptExecutionInput): Promise<ExecutionResult>;
}
