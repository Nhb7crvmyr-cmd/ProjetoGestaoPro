// Coluna esquerda do Chat, no estilo do WhatsApp Web: cabeçalho, busca arredondada, abas "Todas"/"Não lidas"
// e a lista de conversas (avatar, nome, horário, última mensagem com tiques e bolinha verde de não lidas).

import { useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import type { Conversation } from '../data/demoConversations';
import { avatarColor, WA } from './chatTheme';

/** Propriedades da lista. */
interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

/**
 * Hora curta da última mensagem: "14:32" se foi hoje, "Ontem" ou "16/10" se foi antes (como no WhatsApp).
 * @param iso - data/hora ISO
 * @returns texto curto
 */
export function shortTime(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/**
 * Desenha a coluna.
 * @param props - conversas, selecionada e ação de escolher
 * @returns a coluna da lista
 */
export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const [search, setSearch] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const term = search.trim().toLowerCase();
  // Mais recentes primeiro (pela última mensagem).
  const sorted = [...conversations]
    .filter((conversation) => (!term || conversation.customerName.toLowerCase().includes(term)) && (!onlyUnread || conversation.unread > 0))
    .sort((a, b) => b.messages[b.messages.length - 1].at.localeCompare(a.messages[a.messages.length - 1].at));

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Cabeçalho. */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4" style={{ backgroundColor: WA.panel }}>
        <h1 className="text-lg font-semibold" style={{ color: WA.text }}>
          Conversas
        </h1>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800" title="Nada é enviado de verdade">
          Prévia
        </span>
      </div>

      {/* Busca + abas. */}
      <div className="space-y-2 border-b px-3 py-2" style={{ borderColor: WA.border }}>
        <label className="relative block">
          <span className="sr-only">Pesquisar conversa</span>
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#54656f]" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar"
            className="block w-full rounded-lg py-2 pl-10 pr-3 text-sm outline-none placeholder:text-[#667781] focus:ring-2 focus:ring-[#00a884]/30"
            style={{ backgroundColor: WA.panel, color: WA.text }}
          />
        </label>
        <div className="flex gap-2">
          {[
            { label: 'Todas', value: false },
            { label: 'Não lidas', value: true },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setOnlyUnread(tab.value)}
              className={`rounded-full px-3 py-1 text-sm transition ${onlyUnread === tab.value ? 'bg-[#d9fdd3] font-medium text-[#008069]' : 'bg-[#f0f2f5] text-[#667781] hover:bg-[#e9edef]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {sorted.map((conversation) => {
          const last = conversation.messages[conversation.messages.length - 1];
          const active = conversation.id === selectedId;
          const hasUnread = conversation.unread > 0;
          return (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                className={`flex w-full items-center gap-3 px-3 text-left transition ${active ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'}`}
              >
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-full text-base font-semibold ${avatarColor(conversation.customerName)}`}>
                  {conversation.customerName.charAt(0).toUpperCase()}
                </span>
                {/* Linha divisória só no texto (como no WhatsApp), não embaixo do avatar. */}
                <span className="min-w-0 flex-1 border-b py-3" style={{ borderColor: WA.border }}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[15px]" style={{ color: WA.text }}>
                      {conversation.customerName}
                    </span>
                    <span className={`shrink-0 text-xs ${hasUnread ? 'font-medium text-[#1fa855]' : 'text-[#667781]'}`}>{shortTime(last.at)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1 text-sm" style={{ color: WA.muted }}>
                      {/* Tiques na última mensagem quando ela é sua. */}
                      {last.from === 'me' && (
                        <Icon name="checkCheck" className={`size-4 shrink-0 ${last.status === 'read' ? 'text-[#53bdeb]' : 'text-[#8696a0]'}`} />
                      )}
                      <span className="truncate">{last.text}</span>
                    </span>
                    {hasUnread && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white" style={{ backgroundColor: WA.green }}>
                        {conversation.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {sorted.length === 0 && (
          <li className="px-4 py-8 text-center text-sm" style={{ color: WA.muted }}>
            {onlyUnread ? 'Nenhuma conversa não lida.' : 'Nenhuma conversa encontrada.'}
          </li>
        )}
      </ul>
    </div>
  );
}
