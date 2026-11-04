// Cores do Chat, no estilo do WhatsApp Web (pedido do usuário). Ficam todas aqui para ajustar num lugar só.
// São usadas como "valores arbitrários" do Tailwind, ex.: bg-[#f0f2f5].

export const WA = {
  /** Fundo dos cabeçalhos e da barra de digitação (cinza-claro). */
  panel: '#f0f2f5',
  /** Fundo da conversa (bege). */
  wallpaper: '#efeae2',
  /** Balão das SUAS mensagens (verde-claro). */
  outgoing: '#d9fdd3',
  /** Verde das bolinhas de "não lidas" e do horário com mensagem nova. */
  green: '#25d366',
  /** Verde do botão de enviar. */
  send: '#00a884',
  /** Azul dos tiques quando o cliente leu. */
  tickRead: '#53bdeb',
  /** Texto principal e secundário. */
  text: '#111b21',
  muted: '#667781',
  /** Linhas divisórias. */
  border: '#e9edef',
} as const;

/**
 * Cor do avatar a partir do nome (sempre a mesma cor para o mesmo nome).
 * Soma os códigos das letras e escolhe uma das cores da lista.
 * @param name - nome do cliente
 * @returns classes de fundo e texto do avatar
 */
export function avatarColor(name: string): string {
  const colors = ['bg-emerald-100 text-emerald-800', 'bg-sky-100 text-sky-800', 'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-800', 'bg-violet-100 text-violet-800', 'bg-teal-100 text-teal-800'];
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return colors[sum % colors.length];
}
