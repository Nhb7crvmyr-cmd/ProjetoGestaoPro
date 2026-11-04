// Conjunto de ícones do sistema em SVG (desenhos vetoriais: nítidos em qualquer tamanho, sem baixar nada).
// Substituem emojis e símbolos de texto (✓ ✕ ▲ ‹ › → 👍...), que mudam de aparência em cada aparelho.
// Estilo "traço" (stroke) de 24×24, no padrão de ícones modernos; a cor vem do texto (currentColor).

/** Desenho de cada ícone: um ou mais "d" de <path> (o caminho que a caneta percorre). */
const PATHS = {
  check: ['M20 6 9 17l-5-5'],
  checkCheck: ['M18 6 7 17l-5-5', 'm22 10-7.5 7.5L13 16'],
  moreVertical: ['M12 12h.01', 'M12 5h.01', 'M12 19h.01'],
  paperclip: ['m21.4 11-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5'],
  send: ['M14.5 21.5 22 2 2.5 9.5l8.3 3.2Z', 'M22 2 10.8 12.7'],
  message: ['M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z'],
  phone: ['M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z'],
  lock: ['M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z', 'M8 9V7a4 4 0 0 1 8 0v2'],
  crown: ['M2 18 4 6l5 5 3-7 3 7 5-5 2 12Z', 'M4 21h16'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  circle: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z'],
  checkCircle: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'm8.5 12 2.5 2.5 4.5-5'],
  chevronLeft: ['m15 18-6-6 6-6'],
  chevronUp: ['m18 15-6-6-6 6'],
  chevronDown: ['m6 9 6 6 6-6'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'm21 21-4.3-4.3'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  chevronRight: ['m9 18 6-6-6-6'],
  arrowLeft: ['M19 12H5', 'm12 19-7-7 7-7'],
  arrowRight: ['M5 12h14', 'm12 5 7 7-7 7'],
  trendingUp: ['m22 7-8.5 8.5-5-5L2 17', 'M16 7h6v6'],
  trendingDown: ['m22 17-8.5-8.5-5 5L2 7', 'M16 17h6v-6'],
  wallet: ['M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5', 'M17 14h.01'],
  receipt: ['M4 3v18l3-2 3 2 2-2 2 2 3-2 3 2V3l-3 2-3-2-2 2-2-2-3 2Z', 'M8 9h8', 'M8 13h6'],
  tag: ['M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z', 'M7.5 7.5h.01'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
  package: ['M16.5 9.4 7.5 4.2', 'M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z', 'M3.3 7 12 12l8.7-5', 'M12 22V12'],
  creditCard: ['M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', 'M2 10h20'],
  calendar: ['M8 2v4', 'M16 2v4', 'M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z', 'M3 10h18'],
  sparkles: ['M12 3 10.1 8.1 5 10l5.1 1.9L12 17l1.9-5.1L19 10l-5.1-1.9Z', 'M5 3v4', 'M3 5h4', 'M19 17v4', 'M17 19h4'],
} as const;

/** Nomes válidos de ícone (gerado a partir da lista acima). */
export type IconName = keyof typeof PATHS;

/** Propriedades do ícone. */
interface IconProps {
  name: IconName;
  /** Tamanho e cor vêm das classes (ex.: "size-4 text-emerald-600"). */
  className?: string;
  /** Espessura do traço (2 = padrão; 2.5 = mais forte, bom para ícones pequenos). */
  strokeWidth?: number;
  /** Texto para leitores de tela. Sem ele, o ícone é decorativo (escondido dos leitores). */
  label?: string;
}

/**
 * Desenha um ícone.
 * @param props - nome, classes, espessura e rótulo
 * @returns o <svg>
 */
export function Icon({ name, className = 'size-4', strokeWidth = 2, label }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      // Decorativo = aria-hidden; com rótulo = role="img" + aria-label.
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
