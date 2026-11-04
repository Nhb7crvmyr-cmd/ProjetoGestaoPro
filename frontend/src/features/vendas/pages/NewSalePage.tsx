// Página "Nova venda": escolher o cliente, adicionar produtos (lista com busca), desconto, pagamento e finalizar.
// O total mostrado aqui é só uma prévia: o backend recalcula tudo com os preços do banco.

import { useState } from 'react';
import { Link } from 'react-router';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { SelectField } from '../../../components/ui/SelectField';
import { TextField } from '../../../components/ui/TextField';
import { formatCents, formatMoneyInput, parseMoneyInput } from '../../../utils/formatters';
import { useCustomers } from '../../clientes/hooks/useCustomers';
import type { Customer } from '../../clientes/services/customerService';
import { useProducts } from '../../produtos/hooks/useProducts';
import type { Product } from '../../produtos/services/productService';
import { CartItems, type CartItem } from '../components/CartItems';
import { CustomerPicker } from '../components/CustomerPicker';
import { ProductPicker } from '../components/ProductPicker';
import { PAYMENT_METHODS, type PaymentMethod } from '../constants/paymentMethods';
import { useCreateSale } from '../hooks/useSales';
import type { Sale } from '../services/saleService';
import { Icon } from '../../../components/ui/Icon';

/**
 * Tela de nova venda.
 * @returns a página
 */
export function NewSalePage() {
  const customersQuery = useCustomers();
  const productsQuery = useProducts();
  const createSale = useCreateSale();

  const [customer, setCustomer] = useState<Customer>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [notes, setNotes] = useState('');
  // Venda concluída (mostra a tela de sucesso).
  const [doneSale, setDoneSale] = useState<Sale>();

  // Map productId → quantidade no carrinho (para a lista de produtos descontar do disponível).
  const inCart = new Map(cart.map((item) => [item.product.productId, item.quantity]));
  const subtotalCents = cart.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
  const discountCents = parseMoneyInput(discount);
  const totalCents = Math.max(0, subtotalCents - discountCents);

  // O que falta para poder finalizar (mostrado ao lado do botão).
  const missing = !customer ? 'Escolha o cliente.' : cart.length === 0 ? 'Adicione produtos.' : !paymentMethod ? 'Escolha a forma de pagamento.' : discountCents > subtotalCents ? 'O desconto é maior que o total.' : null;

  /**
   * Adiciona um produto (ou soma 1, se já estiver no carrinho, sem passar do estoque).
   * @param product - produto escolhido
   */
  function addProduct(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.product.productId === product.productId);
      if (existing) {
        return current.map((item) =>
          item.product.productId === product.productId ? { ...item, quantity: Math.min(product.stock, item.quantity + 1) } : item,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  /** Finaliza a venda. */
  async function handleFinish() {
    if (missing || !customer || !paymentMethod) return;
    try {
      const sale = await createSale.mutateAsync({
        customerId: customer.customerId,
        items: cart.map((item) => ({ productId: item.product.productId, quantity: item.quantity })),
        discountCents: discountCents || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      setDoneSale(sale);
    } catch {
      // O erro aparece pelo createSale.error (ex.: estoque insuficiente).
    }
  }

  /** Limpa tudo para uma nova venda. */
  function reset() {
    setCustomer(undefined);
    setCart([]);
    setDiscount('');
    setPaymentMethod('');
    setNotes('');
    setDoneSale(undefined);
    createSale.reset();
  }

  if (doneSale) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Icon name="check" className="size-7" strokeWidth={2.5} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-zinc-900">Venda #{doneSale.number} registrada!</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {doneSale.customerName} · {formatCents(doneSale.totalCents)}. O estoque já foi atualizado.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={reset}>Nova venda</Button>
          <Link to="/vendas" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Ver vendas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/vendas" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
          <Icon name="arrowLeft" /> Voltar para vendas
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Nova venda</h1>
      </div>

      {(customersQuery.isError || productsQuery.isError) && <Alert type="error">Não foi possível carregar clientes ou produtos.</Alert>}

      {/* Duas colunas no computador: escolhas à esquerda, resumo à direita. */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-zinc-200">
            <h2 className="font-semibold text-zinc-900">1. Cliente</h2>
            {customersQuery.isPending ? (
              <p className="text-sm text-zinc-500">Carregando clientes…</p>
            ) : (
              <CustomerPicker customers={customersQuery.data ?? []} selected={customer} onSelect={setCustomer} />
            )}
          </section>

          <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-zinc-200">
            <h2 className="font-semibold text-zinc-900">2. Produtos</h2>
            {productsQuery.isPending ? (
              <p className="text-sm text-zinc-500">Carregando produtos…</p>
            ) : (
              <ProductPicker products={productsQuery.data ?? []} inCart={inCart} onAdd={addProduct} />
            )}
          </section>
        </div>

        <aside className="lg:col-span-2">
          {/* "sticky": o resumo acompanha a rolagem da página no computador. */}
          <div className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-zinc-200 lg:sticky lg:top-24">
            <h2 className="font-semibold text-zinc-900">3. Resumo</h2>
            <CartItems
              items={cart}
              onChangeQuantity={(productId, quantity) =>
                setCart((current) => current.map((item) => (item.product.productId === productId ? { ...item, quantity } : item)))
              }
              onRemove={(productId) => setCart((current) => current.filter((item) => item.product.productId !== productId))}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Desconto (R$)"
                inputMode="numeric"
                placeholder="0,00"
                value={discount}
                onChange={(event) => setDiscount(formatMoneyInput(event.target.value))}
              />
              <SelectField
                label="Pagamento"
                placeholder="Escolha"
                options={PAYMENT_METHODS}
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              />
            </div>
            <TextField label="Observações (opcional)" value={notes} maxLength={300} onChange={(event) => setNotes(event.target.value)} />

            <dl className="space-y-1 border-t border-zinc-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Subtotal</dt>
                <dd className="tabular-nums text-zinc-900">{formatCents(subtotalCents)}</dd>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Desconto</dt>
                  <dd className="tabular-nums text-red-600">− {formatCents(discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-1 text-base">
                <dt className="font-semibold text-zinc-900">Total</dt>
                <dd className="font-bold tabular-nums text-zinc-900">{formatCents(totalCents)}</dd>
              </div>
            </dl>

            {createSale.isError && <Alert type="error">{createSale.error.message}</Alert>}
            {missing && <p className="text-xs text-zinc-500">{missing}</p>}
            <Button onClick={handleFinish} disabled={Boolean(missing)} isLoading={createSale.isPending}>
              {createSale.isPending ? 'Registrando…' : `Finalizar venda · ${formatCents(totalCents)}`}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
