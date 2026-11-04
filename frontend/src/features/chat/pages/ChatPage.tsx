// Página "Chat" em modo PRÉVIA, no estilo do WhatsApp Web e ocupando a tela inteira.
// Só no site: sem API e sem WebSocket. Nada é enviado nem salvo (ao recarregar, volta ao exemplo).
// O Chat de verdade (mensagens em tempo real pelo API Gateway WebSocket) é a Etapa 12.

import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { useCustomers } from '../../clientes/hooks/useCustomers';
import { FeatureGate } from '../../planos/components/FeatureGate';
import { ChatWindow } from '../components/ChatWindow';
import { WA } from '../components/chatTheme';
import { ConversationList } from '../components/ConversationList';
import { buildDemoConversations, DEMO_REPLIES, type ChatMessage, type Conversation } from '../data/demoConversations';

/**
 * Conteúdo do chat (já liberado pelo plano).
 * @returns a tela de duas colunas, na altura da janela
 */
function ChatPreview() {
  const customersQuery = useCustomers();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  // Conversa "digitando" no momento (simulação de resposta).
  const [typingId, setTypingId] = useState<string>();
  // Guarda os "timers" da simulação para cancelar se a pessoa sair da página.
  const timers = useRef<number[]>([]);

  // Monta as conversas de exemplo uma vez, quando os clientes carregam.
  useEffect(() => {
    if (customersQuery.isSuccess && conversations.length === 0) {
      setConversations(buildDemoConversations(customersQuery.data.filter((customer) => customer.active)));
    }
  }, [customersQuery.isSuccess, customersQuery.data, conversations.length]);

  // Limpeza: cancela respostas simuladas pendentes ao sair da página.
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  const selected = conversations.find((conversation) => conversation.id === selectedId);
  // Guarda a conversa aberta num "ref" para o timer saber qual está aberta NA HORA em que a resposta chega
  // (o valor de "selectedId" dentro do timer seria o de quando a mensagem foi enviada).
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  /**
   * Muda UMA conversa (as outras ficam iguais).
   * @param id - conversa
   * @param change - função que recebe a conversa e devolve a versão nova
   */
  function updateConversation(id: string, change: (conversation: Conversation) => Conversation) {
    setConversations((current) => current.map((conversation) => (conversation.id === id ? change(conversation) : conversation)));
  }

  /**
   * Abre uma conversa e marca como lida.
   * @param id - conversa
   */
  function select(id: string) {
    setSelectedId(id);
    updateConversation(id, (conversation) => ({ ...conversation, unread: 0 }));
  }

  /**
   * "Envia" a mensagem (só na tela) e simula o cliente lendo e respondendo.
   * @param text - texto digitado
   */
  function send(text: string) {
    if (!selected) return;
    const id = selected.id;
    const mine: ChatMessage = { id: crypto.randomUUID(), from: 'me', text, at: new Date().toISOString(), status: 'sent' };
    updateConversation(id, (conversation) => ({ ...conversation, messages: [...conversation.messages, mine] }));

    // Simulação: 0,8 s → o cliente "leu" (tiques azuis) e começa a digitar; 2,2 s → chega a resposta.
    timers.current.push(
      window.setTimeout(() => {
        updateConversation(id, (conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) => (message.from === 'me' ? { ...message, status: 'read' } : message)),
        }));
        setTypingId(id);
      }, 800),
    );
    timers.current.push(
      window.setTimeout(() => {
        setTypingId(undefined);
        const reply: ChatMessage = {
          id: crypto.randomUUID(),
          from: 'customer',
          text: DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)],
          at: new Date().toISOString(),
        };
        // Se a pessoa estiver em outra conversa, a resposta conta como "não lida".
        updateConversation(id, (conversation) => ({
          ...conversation,
          messages: [...conversation.messages, reply],
          unread: id === selectedIdRef.current ? 0 : conversation.unread + 1,
        }));
      }, 2200),
    );
  }

  return (
    // Altura = janela inteira menos a barra do topo (h-16 = 4rem). Duas colunas como no WhatsApp Web.
    <div className="grid h-[calc(100dvh-4rem)] bg-white lg:grid-cols-[minmax(320px,30%)_1fr]">
      {/* No celular: mostra a lista OU a conversa. */}
      <div className={`min-h-0 border-r ${selected ? 'hidden lg:block' : 'block'}`} style={{ borderColor: WA.border }}>
        {customersQuery.isPending ? (
          <p className="p-4 text-sm text-zinc-500">Carregando…</p>
        ) : (
          <ConversationList conversations={conversations} selectedId={selectedId} onSelect={select} />
        )}
      </div>
      <div className={`min-h-0 ${selected ? 'block' : 'hidden lg:block'}`}>
        {selected ? (
          <ChatWindow conversation={selected} typing={typingId === selected.id} onSend={send} onBack={() => setSelectedId(undefined)} />
        ) : (
          // Tela inicial (nenhuma conversa aberta), como a do WhatsApp Web.
          <div className="flex h-full flex-col items-center justify-center gap-3 border-b-[6px] px-6 text-center" style={{ backgroundColor: WA.panel, borderColor: WA.send }}>
            <span className="flex size-16 items-center justify-center rounded-full bg-white text-[#00a884] shadow-sm">
              <Icon name="message" className="size-8" />
            </span>
            <p className="text-3xl font-light" style={{ color: WA.text }}>
              Gestão Pro Chat
            </p>
            <p className="max-w-md text-sm" style={{ color: WA.muted }}>
              Atenda seus clientes por aqui. Escolha uma conversa na lista para começar.
            </p>
            <p className="mt-6 flex items-center gap-1.5 text-xs" style={{ color: WA.muted }}>
              <Icon name="lock" className="size-3" /> Prévia: nenhuma mensagem é enviada de verdade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Página do chat, protegida pelo plano (Chat é a partir do Profissional).
 * @returns a prévia ou o cartão de bloqueio
 */
export function ChatPage() {
  return (
    <FeatureGate feature="chat">
      <ChatPreview />
    </FeatureGate>
  );
}
