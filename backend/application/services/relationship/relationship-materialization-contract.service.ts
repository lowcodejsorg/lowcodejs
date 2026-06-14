/* eslint-disable no-unused-vars */
import type { Either } from '@application/core/either.core';
import type {
  E_RELATIONSHIP_ON_DELETE,
  IField,
  ITable,
  ValueOf,
} from '@application/core/entity.core';
import type HTTPException from '@application/core/exception.core';

export type RelationshipMaterializeParams = {
  // Campo RELATIONSHIP recém-criado (lado source).
  sourceField: IField;
  // Tabela que contém o campo source.
  sourceTable: ITable;
  onDelete: ValueOf<typeof E_RELATIONSHIP_ON_DELETE>;
  // Configuração do lado espelho (target). multiple deriva a cardinalidade.
  mirrorMultiple: boolean;
  mirrorVisible: boolean;
};

export type RelationshipMaterializeResult = {
  definitionId: string;
  mirrorFieldId: string;
};

export abstract class RelationshipMaterializationContractService {
  // Materializa o pivô de um campo RELATIONSHIP recém-criado: cria a
  // RelationshipDefinition (fonte de verdade), o campo-espelho no target e
  // liga os dois lados (relationshipId). Faz o campo "nascer pivô".
  abstract materialize(
    params: RelationshipMaterializeParams,
  ): Promise<Either<HTTPException, RelationshipMaterializeResult>>;
}
