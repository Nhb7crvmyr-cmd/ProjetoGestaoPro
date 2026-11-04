// Dados de EXEMPLO da prévia do Chat (nada é enviado nem salvo). Os nomes vêm dos clientes reais da empresa,
// para a prévia ficar parecida com o uso de verdade; as mensagens são inventadas.

/** Uma mensagem da conversa. */
export interface ChatMessage {
  id: string;
  /** "customer" = mensagem do cliente; "me" = mensagem de quem está atendendo. */
  from: 'customer' | 'me';
  text: string;
  /** Hora (ISO). */
  at: string;
  /** Só nas SUAS mensagens: "sent" = enviada (tiques cinza); "read" = o cliente leu (tiques azuis). */
  status?: 'sent' | 'read';
}

/** Uma conversa com um cliente. */
export interface Conversation {
  id: string;
  customerName: string;
  phone?: string;
  messages: ChatMessage[];
  /** Mensagens do cliente ainda não lidas. */
  unread: number;
  /** "Online" na prévia (bolinha verde). */
  online: boolean;
}

/** Conversas de exemplo (o texto que cada cliente "mandou"). */
const SCRIPTS: { from: 'customer' | 'me'; text: string; minutesAgo: number }[][] = [
  [
    { from: 'customer', text: 'Oi! Vocês ainda têm a camiseta azul no tamanho M?', minutesAgo: 42 },
    { from: 'me', text: 'Olá! Temos sim, 8 unidades em estoque.', minutesAgo: 40 },
    { from: 'customer', text: 'Ótimo! Consigo pagar no Pix?', minutesAgo: 3 },
  ],
  [
    { from: 'customer', text: 'Bom dia, meu pedido já foi separado?', minutesAgo: 120 },
    { from: 'me', text: 'Bom dia! Já está separado, pode retirar a partir das 14h.', minutesAgo: 115 },
    { from: 'customer', text: 'Perfeito, obrigada!', minutesAgo: 110 },
  ],
  [{ from: 'customer', text: 'Vocês fazem desconto para compras acima de 5 peças?', minutesAgo: 15 }],
  [
    { from: 'me', text: 'Olá! Chegaram novidades que combinam com a sua última compra.', minutesAgo: 60 * 26 },
    { from: 'customer', text: 'Manda o catálogo, por favor!', minutesAgo: 60 * 25 },
  ],
  [{ from: 'customer', text: 'Qual o horário de funcionamento no sábado?', minutesAgo: 8 }],
];

/** Respostas automáticas que o "cliente" manda depois que você escreve (simulação). */
export const DEMO_REPLIES = [
  'Entendi, obrigado pelo retorno!',
  'Perfeito. Pode reservar para mim?',
  'Legal! E qual o prazo de entrega?',
  'Combinado, passo aí mais tarde.',
  'Show! Me manda o valor total, por favor.',
];

/** Respostas rápidas (atalhos) para quem atende. */
export const QUICK_REPLIES = ['Olá! Como posso ajudar?', 'Temos sim em estoque!', 'Seu pedido já está separado.', 'Posso te enviar o catálogo?'];

/** Nomes usados quando a empresa ainda não tem clientes cadastrados. */
const FALLBACK_NAMES = ['Camila Souza', 'Bruno Lima', 'Ana Pereira', 'Rafael Costa', 'Juliana Alves'];

/**
 * Monta as conversas de exemplo a partir dos clientes (os 5 primeiros) ou de nomes de exemplo.
 * @param customers - clientes da empresa (nome e telefone)
 * @returns as conversas da prévia
 */
export function buildDemoConversations(customers: { customerId: string; name: string; phone: string }[]): Conversation[] {
  const people = customers.length
    ? customers.slice(0, SCRIPTS.length).map((customer) => ({ id: customer.customerId, name: customer.name, phone: customer.phone }))
    : FALLBACK_NAMES.map((name, index) => ({ id: `demo-${index}`, name, phone: undefined }));

  return people.map((person, index) => {
    const script = SCRIPTS[index % SCRIPTS.length];
    const messages = script.map((message, messageIndex) => ({
      id: `${person.id}-${messageIndex}`,
      from: message.from,
      text: message.text,
      at: new Date(Date.now() - message.minutesAgo * 60_000).toISOString(),
      // Nas conversas de exemplo, as suas mensagens antigas já foram lidas.
      status: message.from === 'me' ? ('read' as const) : undefined,
    }));
    const last = script[script.length - 1];
    return {
      id: person.id,
      customerName: person.name,
      phone: person.phone,
      messages,
      // Não lidas: as mensagens do cliente no fim da conversa.
      unread: last.from === 'customer' && last.minutesAgo < 60 ? 1 : 0,
      online: index % 2 === 0,
    };
  });
}
