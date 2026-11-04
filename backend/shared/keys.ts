// Formato das chaves (pk/sk) de cada tipo de registro na tabela única do DynamoDB.
//
// Centralizar aqui evita erro de digitação espalhado pelo código. Mapa atual:
//   Empresa ............ pk = EMPRESA#<empresaId>   sk = PROFILE
//   Trava de documento . pk = DOCUMENT#<cnpj/cpf>   sk = DOCUMENT    (impede CNPJ/CPF repetido)
//   Vínculo do usuário . pk = USER#<userId>         sk = COMPANY     (impede 2 empresas por usuário)
//   Índice do admin .... pk = COMPANIES             sk = EMPRESA#<empresaId> (lista para o SuperAdmin)
//   Funcionário ........ pk = EMPRESA#<empresaId>   sk = EMPLOYEE#<userId>
//   Produto ............ pk = EMPRESA#<empresaId>   sk = PRODUCT#<productId>
//   Trava de SKU ....... pk = EMPRESA#<empresaId>   sk = SKU#<sku>        (SKU único dentro da empresa)
//   Movimento estoque .. pk = EMPRESA#<empresaId>   sk = STOCKMOV#<data ISO>#<id>
//   Cliente ............ pk = EMPRESA#<empresaId>   sk = CUSTOMER#<customerId>
//   Trava doc. cliente . pk = EMPRESA#<empresaId>   sk = CUSTDOC#<cpf/cnpj> (documento único na empresa)
//   Venda .............. pk = EMPRESA#<empresaId>   sk = SALE#<saleId>   (o saleId começa com a data: ordena por tempo)
//   Contador de vendas . pk = EMPRESA#<empresaId>   sk = COUNTER#SALE    (número sequencial #1, #2...)
//   Pedido de cancel. .. pk = EMPRESA#<empresaId>   sk = CANCELREQ#<saleId> (existe só enquanto o Dono não decide)
//
// O movimento usa a DATA na sk: o DynamoDB guarda as sk em ordem, então o Query já devolve
// os movimentos em ordem cronológica (e com ScanIndexForward=false, do mais novo para o mais velho).
//
// Repare: o funcionário fica na MESMA partição da empresa. Assim, um Query em "EMPRESA#<id>"
// com sk começando por "EMPLOYEE#" traz todos os funcionários daquela empresa, e só dela.

/** Chave do perfil da empresa. */
export const companyKey = (empresaId: string) => ({ pk: `EMPRESA#${empresaId}`, sk: 'PROFILE' });

/** Chave da trava de documento (um CNPJ/CPF só pode ter uma empresa). */
export const documentLockKey = (document: string) => ({ pk: `DOCUMENT#${document}`, sk: 'DOCUMENT' });

/** Chave do vínculo usuário → empresa. */
export const userCompanyKey = (userId: string) => ({ pk: `USER#${userId}`, sk: 'COMPANY' });

/** Partição única onde o SuperAdmin lista todas as empresas (com um Query, sem varrer a tabela). */
export const COMPANIES_INDEX_PK = 'COMPANIES';

/** Chave do item da empresa no índice do admin. */
export const companyIndexKey = (empresaId: string) => ({ pk: COMPANIES_INDEX_PK, sk: `EMPRESA#${empresaId}` });

/** Começo da sk de todo funcionário (usado no Query com begins_with). */
export const EMPLOYEE_SK_PREFIX = 'EMPLOYEE#';

/** Chave do funcionário dentro da partição da empresa. */
export const employeeKey = (empresaId: string, userId: string) => ({
  pk: `EMPRESA#${empresaId}`,
  sk: `${EMPLOYEE_SK_PREFIX}${userId}`,
});

/** Começo da sk de todo produto. */
export const PRODUCT_SK_PREFIX = 'PRODUCT#';

/** Chave do produto dentro da partição da empresa. */
export const productKey = (empresaId: string, productId: string) => ({
  pk: `EMPRESA#${empresaId}`,
  sk: `${PRODUCT_SK_PREFIX}${productId}`,
});

/** Chave da trava de SKU (impede dois produtos com o mesmo código na mesma empresa). */
export const skuLockKey = (empresaId: string, sku: string) => ({ pk: `EMPRESA#${empresaId}`, sk: `SKU#${sku}` });

/** Começo da sk de todo movimento de estoque. */
export const STOCK_MOVEMENT_SK_PREFIX = 'STOCKMOV#';

/** Chave de um movimento de estoque (data primeiro, para ordenar por tempo). */
export const stockMovementKey = (empresaId: string, createdAt: string, movementId: string) => ({
  pk: `EMPRESA#${empresaId}`,
  sk: `${STOCK_MOVEMENT_SK_PREFIX}${createdAt}#${movementId}`,
});

/** Começo da sk de todo cliente. */
export const CUSTOMER_SK_PREFIX = 'CUSTOMER#';

/** Chave do cliente dentro da partição da empresa. */
export const customerKey = (empresaId: string, customerId: string) => ({
  pk: `EMPRESA#${empresaId}`,
  sk: `${CUSTOMER_SK_PREFIX}${customerId}`,
});

/** Chave da trava do documento do cliente (impede dois clientes com o mesmo CPF/CNPJ na empresa). */
export const customerDocLockKey = (empresaId: string, document: string) => ({
  pk: `EMPRESA#${empresaId}`,
  sk: `CUSTDOC#${document}`,
});

/** Começo da sk de toda venda. */
export const SALE_SK_PREFIX = 'SALE#';

/** Chave da venda dentro da partição da empresa. */
export const saleKey = (empresaId: string, saleId: string) => ({ pk: `EMPRESA#${empresaId}`, sk: `${SALE_SK_PREFIX}${saleId}` });

/** Chave do contador que gera o número sequencial das vendas da empresa. */
export const saleCounterKey = (empresaId: string) => ({ pk: `EMPRESA#${empresaId}`, sk: 'COUNTER#SALE' });

/** Começo da sk dos pedidos de cancelamento pendentes. */
export const CANCEL_REQUEST_SK_PREFIX = 'CANCELREQ#';

/** Chave do pedido de cancelamento pendente de uma venda. */
export const cancelRequestKey = (empresaId: string, saleId: string) => ({
  pk: `EMPRESA#${empresaId}`,
  sk: `${CANCEL_REQUEST_SK_PREFIX}${saleId}`,
});
