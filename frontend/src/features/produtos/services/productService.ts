// Chamadas à API do módulo produtos: listar (Dono e Funcionario), cadastrar e editar (só Dono).

import { apiFetch } from '../../../services/apiClient';
import type { ProductUnit } from '../constants/units';

/** Produto como a API devolve. "costCents" só vem para o Dono. */
export interface Product {
  productId: string;
  name: string;
  sku?: string;
  category?: string;
  unit: ProductUnit;
  priceCents: number;
  costCents?: number;
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Campos enviados no cadastro e na edição (dinheiro em centavos). */
export interface ProductInput {
  name: string;
  sku?: string;
  category?: string;
  unit: ProductUnit;
  priceCents: number;
  costCents?: number;
  minStock: number;
}

/**
 * Lista os produtos da empresa.
 * @returns os produtos (ordem alfabética)
 */
export async function listProducts(): Promise<Product[]> {
  const { products } = await apiFetch<{ products: Product[] }>('/produtos');
  return products;
}

/**
 * Cadastra um produto.
 * @param input - dados do produto + estoque inicial opcional
 * @returns o produto criado
 */
export async function createProduct(input: ProductInput & { initialStock?: number }): Promise<Product> {
  const { product } = await apiFetch<{ product: Product }>('/produtos', { method: 'POST', body: JSON.stringify(input) });
  return product;
}

/**
 * Edita um produto (o estoque não muda por aqui).
 * @param productId - id do produto
 * @param input - dados do produto + ativo/inativo
 * @returns o produto atualizado
 */
export async function updateProduct(productId: string, input: ProductInput & { active: boolean }): Promise<Product> {
  const { product } = await apiFetch<{ product: Product }>(`/produtos/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return product;
}

/**
 * Diz se o produto está com estoque baixo (no mínimo ou abaixo dele).
 * @param product - o produto
 * @returns true se precisa de reposição
 */
export function isLowStock(product: Pick<Product, 'stock' | 'minStock'>): boolean {
  return product.stock <= product.minStock;
}
