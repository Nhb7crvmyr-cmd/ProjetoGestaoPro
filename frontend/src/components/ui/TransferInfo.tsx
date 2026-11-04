// Linha de histórico da última transferência de atendimento de um cliente:
// "Transferido por Carlos em 16/10 · de Wellington (suporte) para Cícero".
// Usada na lista de clientes do Dono e no painel do SuperAdmin.

import { formatDate } from '../../utils/formatters';

/** Dados da última transferência (como a API devolve). */
export interface LastTransfer {
  fromSellerName: string;
  toSellerName: string;
  /** Nome de quem fez. Transferências antigas podem não ter. */
  byName?: string;
  byRole?: 'Dono' | 'SuperAdmin';
  at: string;
}

/**
 * Desenha a linha de histórico.
 * @param props - a transferência
 * @returns o texto pequeno, em cinza
 */
export function TransferInfo({ transfer }: { transfer: LastTransfer }) {
  // Sem o nome (registros antigos), mostra o papel.
  const by = transfer.byName ?? (transfer.byRole === 'SuperAdmin' ? 'o suporte' : 'o Supervisor');
  return (
    <p className="mt-0.5 text-xs leading-snug text-zinc-500">
      Transferido por <span className="font-medium text-zinc-600">{by}</span> em {formatDate(transfer.at)}
      <br />
      de {transfer.fromSellerName} para {transfer.toSellerName}
    </p>
  );
}
