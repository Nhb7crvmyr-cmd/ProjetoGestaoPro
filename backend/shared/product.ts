// Formato do registro de PRODUTO no banco e funções para lê-lo e "esconder" o custo de quem não é Dono.

import { GetCommand } from '@aws-sdk/lib-dynamodb';
import type { AuthContext } from './auth';
import { dynamo, getTableName } from './dynamo';
import { HttpError } from './errors';
import { productKey } from './keys';

/** Unidades aceitas. Todas contadas em números INTEIROS (1, 2, 3...), para simplificar o estoque. */
export const PRODUCT_UNITS = ['UN', 'CX', 'PC', 'PCT', 'PAR', 'KIT'] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

/** Produto como fica gravado no DynamoDB (sem pk/sk). */
export interface Product {
  productId: string;
  empresaId: string;
  name: string;
  /** Código interno/SKU (opcional, único na empresa, em maiúsculas). */
  sku?: string;
  category?: string;
  unit: ProductUnit;
  /** Preço de venda em centavos. */
  priceCents: number;
  /** Custo em centavos (só o Dono vê). */
  costCents?: number;
  /** Quantidade atual em estoque. Só muda por movimento de estoque (ou venda, na Etapa 9). */
  stock: number;
  /** Abaixo disso, o produto aparece com alerta de "estoque baixo". */
  minStock: number;
  /** false = desativado (some das vendas, mas o histórico continua). */
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Busca um produto DENTRO da empresa informada (o empresaId vem do token).
 * @param empresaId - empresa do usuário logado
 * @param productId - id do produto
 * @returns o produto; lança 404 se não existir nesta empresa
 */
export async function getProductOrThrow(empresaId: string, productId: string): Promise<Product> {
  const { Item } = await dynamo.send(new GetCommand({ TableName: getTableName(), Key: productKey(empresaId, productId) }));
  if (!Item) throw new HttpError(404, 'Produto não encontrado.');
  const { pk: _pk, sk: _sk, ...product } = Item;
  return product as Product;
}

/**
 * Prepara o produto para enviar ao site: o FUNCIONÁRIO não recebe o custo.
 * Esconder no backend é o que protege de verdade. Se só a tela escondesse,
 * daria para ver o custo nas "ferramentas do desenvolvedor" do navegador.
 * @param product - produto completo
 * @param auth - usuário logado
 * @returns o produto (sem costCents, se não for Dono)
 */
export function toProductResponse(product: Product, auth: AuthContext): Omit<Product, 'costCents'> & { costCents?: number } {
  if (auth.groups.includes('Dono')) return product;
  const { costCents: _cost, ...rest } = product;
  return rest;
}
