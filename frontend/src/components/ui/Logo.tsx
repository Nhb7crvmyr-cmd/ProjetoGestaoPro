// Logo do Gestão Pro, no modelo enviado pelo usuário: 4 formas geométricas em "bandeira/seta" (pentágonos com uma
// ponta à esquerda e a base em diagonal), em grade 2×2, sobre um quadrado azul-marinho. Cores: azul-petróleo,
// verde-menta, azul-ardósia e verde-claro. Ao lado: "Gestão" + selo "PRO". Tem tamanho normal e grande (login).

/** Propriedades do logo. */
interface LogoProps {
  /** "light" para fundo escuro (texto claro); "dark" para fundo claro (texto azul-marinho). */
  variant?: 'light' | 'dark';
  /** Mostra ou esconde o nome ao lado do ícone. */
  showName?: boolean;
  /** "md" = menu e cabeçalhos; "lg" = página de login (maior). */
  size?: 'md' | 'lg';
}

/**
 * A forma base (um pentágono), desenhada nas medidas do modelo (cada forma ocupa ~140×140 unidades):
 * ponta esquerda (12,130) → canto de cima (70,60) → topo até (150,60) → desce até (150,195)
 * → diagonal de volta até (85,130) → fecha na ponta. As outras 3 são a MESMA forma, só deslocada.
 */
const SHAPE = 'M12 130 70 60h80v135l-65-65z';

/** As 4 formas: deslocamento (translate) e cor, na ordem do modelo. */
const SHAPES = [
  { dx: 0, dy: 0, color: '#5a9fa8' }, // em cima, à esquerda: azul-petróleo
  { dx: 140, dy: 0, color: '#7ecfa6' }, // em cima, à direita: verde-menta
  { dx: 0, dy: 140, color: '#2f5476' }, // embaixo, à esquerda: azul-ardósia
  { dx: 140, dy: 140, color: '#9de8a2' }, // embaixo, à direita: verde-claro
] as const;

/** Classes de cada tamanho: ícone, nome e selo. */
const SIZES = {
  md: { icon: 'size-9', name: 'text-lg', badge: 'text-[10px] px-1.5 py-0.5', gap: 'gap-2.5' },
  lg: { icon: 'size-14', name: 'text-3xl', badge: 'text-xs px-2 py-0.5', gap: 'gap-3.5' },
} as const;

/**
 * Desenha o logo em SVG (imagem vetorial: fica nítida em qualquer tamanho).
 * @param props - variante de cor, se mostra o nome e tamanho
 * @returns o elemento do logo
 */
export function Logo({ variant = 'dark', showName = true, size = 'md' }: LogoProps) {
  const isLight = variant === 'light';
  const classes = SIZES[size];

  return (
    <div className={`flex items-center ${classes.gap}`}>
      {/* aria-hidden: leitores de tela ignoram o desenho, porque o nome já está escrito ao lado.
          viewBox: "janela" de 340×340 nas medidas do modelo, centralizada nas 4 formas. */}
      <svg viewBox="-18 27 340 340" className={`${classes.icon} shrink-0`} aria-hidden="true">
        {/* Fundo azul-marinho. No menu (que já é escuro), uma borda clarinha separa o ícone do fundo. */}
        <rect
          x="-18"
          y="27"
          width="340"
          height="340"
          rx="80"
          fill="#0a1a3f"
          stroke={isLight ? '#ffffff' : 'none'}
          strokeOpacity="0.15"
          strokeWidth="6"
        />
        {SHAPES.map((shape) => (
          // translate move a forma base para a posição de cada uma das 4.
          <path key={`${shape.dx}-${shape.dy}`} d={SHAPE} transform={`translate(${shape.dx} ${shape.dy})`} fill={shape.color} />
        ))}
      </svg>
      {showName && (
        <span className="flex items-center gap-1.5">
          <span className={`${classes.name} font-semibold tracking-tight ${isLight ? 'text-white' : 'text-brand-900'}`}>Gestão</span>
          {/* Selo "PRO": pequeno, em maiúsculas e espaçado. */}
          <span
            className={`rounded-md font-bold uppercase tracking-[0.14em] ${classes.badge} ${
              isLight ? 'bg-white/10 text-brand-200 ring-1 ring-white/15' : 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
            }`}
          >
            Pro
          </span>
        </span>
      )}
    </div>
  );
}
