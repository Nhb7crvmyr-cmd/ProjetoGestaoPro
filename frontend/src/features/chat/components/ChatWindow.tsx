// Janela da conversa no estilo do WhatsApp Web: cabeçalho cinza, fundo bege com textura, balões com "pontinha",
// horário e tiques (✓✓ azuis = lido) dentro do balão, "digitando…", respostas rápidas e a barra de digitação.

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { formatPhone } from '../../../utils/formatters';
import { QUICK_REPLIES, type ChatMessage, type Conversation } from '../data/demoConversations';
import { avatarColor, WA } from './chatTheme';

/** Propriedades da janela. */
interface ChatWindowProps {
  conversation: Conversation;
  /** true enquanto o "cliente" está "digitando" (simulação). */
  typing: boolean;
  onSend: (text: string) => void;
  /** No celular: volta para a lista de conversas. */
  onBack: () => void;
}

/**
 * Hora curta (14:32).
 * @param iso - data/hora ISO
 * @returns texto
 */
const hour = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/**
 * Um balão de mensagem. O primeiro balão de uma sequência do mesmo remetente ganha a "pontinha" (tail),
 * como no WhatsApp; os seguintes ficam sem, para a sequência parecer um bloco.
 * @param props - mensagem e se é o primeiro da sequência
 * @returns o balão
 */
function Bubble({ message, first }: { message: ChatMessage; first: boolean }) {
  const mine = message.from === 'me';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${first ? 'mt-3' : 'mt-0.5'}`}>
      <div
        className={`relative max-w-[65%] rounded-lg px-2.5 pb-1.5 pt-1.5 text-[14.2px] leading-snug shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
          first ? (mine ? 'rounded-tr-none' : 'rounded-tl-none') : ''
        }`}
        style={{ backgroundColor: mine ? WA.outgoing : '#ffffff', color: WA.text }}
      >
        {/* A "pontinha": um triângulo SVG colado no canto de cima do balão. */}
        {first && (
          <svg viewBox="0 0 8 13" className={`absolute top-0 h-[13px] w-2 ${mine ? '-right-2' : '-left-2'}`} aria-hidden="true">
            <path d={mine ? 'M0 0h8L0 13z' : 'M8 0H0l8 13z'} fill={mine ? WA.outgoing : '#ffffff'} />
          </svg>
        )}
        <span className="whitespace-pre-wrap break-words">{message.text}</span>
        {/* Espaço invisível para o horário não ficar em cima do texto; o horário fica no canto de baixo. */}
        <span className="inline-block w-16" aria-hidden="true" />
        <span className="absolute bottom-1 right-2 flex items-center gap-1 text-[11px]" style={{ color: WA.muted }}>
          {hour(message.at)}
          {mine && <Icon name="checkCheck" className={`size-4 ${message.status === 'read' ? 'text-[#53bdeb]' : 'text-[#8696a0]'}`} label={message.status === 'read' ? 'Lida' : 'Enviada'} />}
        </span>
      </div>
    </div>
  );
}

/**
 * Desenha a conversa.
 * @param props - conversa, "digitando", envio e voltar
 * @returns a janela
 */
export function ChatWindow({ conversation, typing, onSend, onBack }: ChatWindowProps) {
  const [text, setText] = useState('');
  // useRef guarda uma referência ao fim da lista, para rolar até a última mensagem.
  const endRef = useRef<HTMLDivElement>(null);

  // Toda vez que chega mensagem (ou começa o "digitando"), rola até o fim.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages.length, typing]);

  /**
   * Envia o texto (se não estiver vazio) e limpa o campo.
   * @param value - texto a enviar
   */
  function send(value: string) {
    const clean = value.trim();
    if (!clean) return;
    onSend(clean);
    setText('');
  }

  /**
   * Enter envia; Shift+Enter quebra a linha (padrão dos apps de conversa).
   * @param event - tecla pressionada
   */
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(text);
    }
  }

  const iconButton = 'flex size-10 items-center justify-center rounded-full text-[#54656f] transition hover:bg-black/5';

  return (
    <div className="flex h-full flex-col">
      {/* Cabeçalho: cliente, status e ações. */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-l px-4" style={{ backgroundColor: WA.panel, borderColor: WA.border }}>
        <button type="button" onClick={onBack} aria-label="Voltar para as conversas" className={`${iconButton} -ml-2 lg:hidden`}>
          <Icon name="arrowLeft" className="size-5" />
        </button>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarColor(conversation.customerName)}`}>
          {conversation.customerName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base" style={{ color: WA.text }}>
            {conversation.customerName}
          </p>
          <p className="truncate text-[13px]" style={{ color: WA.muted }}>
            {typing ? <span className="text-[#1fa855]">digitando…</span> : conversation.online ? 'online' : conversation.phone ? formatPhone(conversation.phone) : 'visto por último hoje'}
          </p>
        </div>
        <button type="button" className={iconButton} aria-label="Pesquisar na conversa" title="Em breve">
          <Icon name="search" className="size-5" />
        </button>
        <button type="button" className={iconButton} aria-label="Mais opções" title="Em breve">
          <Icon name="moreVertical" className="size-5" strokeWidth={3} />
        </button>
      </div>

      {/* Mensagens sobre o fundo bege com textura de pontinhos (feita só com CSS, sem imagem).
          "aria-live": leitores de tela anunciam as mensagens novas. */}
      <div
        className="flex-1 overflow-y-auto px-[6%] py-4"
        style={{
          backgroundColor: WA.wallpaper,
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
        aria-live="polite"
      >
        <p className="mx-auto w-fit rounded-lg bg-white px-3 py-1 text-[12.5px] uppercase shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]" style={{ color: WA.muted }}>
          Hoje
        </p>
        <p className="mx-auto mt-3 max-w-md rounded-lg bg-[#ffeecd] px-3 py-1.5 text-center text-[12.5px] text-[#54656f]">
          <Icon name="lock" className="mr-1 inline size-3" />
          Prévia do chat: as mensagens não são enviadas de verdade. O chat em tempo real chega na Etapa 12.
        </p>
        {conversation.messages.map((message, index) => (
          <Bubble key={message.id} message={message} first={index === 0 || conversation.messages[index - 1].from !== message.from} />
        ))}
        {typing && (
          <div className="mt-3 flex justify-start">
            {/* Três pontinhos pulando (animate-bounce com atrasos diferentes). */}
            <div className="relative flex gap-1 rounded-lg rounded-tl-none bg-white px-4 py-3 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]" aria-label="Cliente digitando">
              <svg viewBox="0 0 8 13" className="absolute -left-2 top-0 h-[13px] w-2" aria-hidden="true">
                <path d="M8 0H0l8 13z" fill="#ffffff" />
              </svg>
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="size-2 animate-bounce rounded-full bg-[#8696a0]" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Barra de digitação: respostas rápidas + anexar + campo + enviar. */}
      <div className="shrink-0 px-4 pb-3 pt-2" style={{ backgroundColor: WA.panel }}>
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => send(reply)}
              className="shrink-0 rounded-full bg-white px-3 py-1 text-[13px] text-[#008069] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] transition hover:bg-[#f5f6f6]"
            >
              {reply}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <button type="button" className={iconButton} aria-label="Anexar" title="Em breve">
            <Icon name="paperclip" className="size-5" />
          </button>
          <label className="flex-1">
            <span className="sr-only">Mensagem</span>
            <textarea
              rows={1}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem"
              className="block max-h-32 w-full resize-none rounded-lg bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-[#667781]"
              style={{ color: WA.text }}
            />
          </label>
          <button
            type="button"
            onClick={() => send(text)}
            disabled={!text.trim()}
            aria-label="Enviar mensagem"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-95 disabled:opacity-40"
            style={{ backgroundColor: WA.send }}
          >
            <Icon name="send" className="size-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
