// Informações do site exibidas ao lado do login/cadastro: o que o Gestão Pro oferece.

/** Cada item da lista de recursos do sistema. */
const highlights = [
  { title: 'Clientes e vendas', text: 'Cadastre clientes e registre vendas com baixa automática no estoque.' },
  { title: 'Estoque sob controle', text: 'Entradas, saídas e ajustes feitos só pelo dono da empresa.' },
  { title: 'Equipe organizada', text: 'Cada funcionário atende os próprios clientes, com acesso limitado.' },
  { title: 'Dashboard e relatórios', text: 'Vendas do mês, quem comprou e o fluxo do mês em gráficos.' },
];

/**
 * Lista os principais recursos do sistema, com um ícone de "check" em cada item.
 * @returns a lista de destaques
 */
export function SiteHighlights() {
  return (
    <ul className="space-y-5">
      {/* .map() transforma cada item do array em um <li>. A "key" ajuda o React a
          identificar cada item quando a lista muda; precisa ser única. */}
      {highlights.map((item) => (
        <li key={item.title} className="flex gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-brand-200">
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <div>
            <p className="font-semibold text-white">{item.title}</p>
            <p className="text-sm text-brand-100/70">{item.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
