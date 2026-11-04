// Cartão com os dados cadastrados da empresa (documento, contato e endereço).

import { formatCep, formatCnpj, formatCpf, formatPhone } from '../../../utils/formatters';
import type { Company } from '../services/companyService';

/**
 * Mostra os dados da empresa, já formatados com máscara.
 * @param props - a empresa
 * @returns o cartão
 */
export function CompanySummaryCard({ company }: { company: Company }) {
  const { address } = company;
  const document = company.documentType === 'CNPJ' ? formatCnpj(company.document) : formatCpf(company.document);

  const rows: [string, string][] = [
    [company.documentType, document],
    ['E-mail', company.email],
    ['Telefone', formatPhone(company.phone)],
    [
      'Endereço',
      // filter(Boolean) remove partes vazias (ex.: sem complemento) antes de juntar com vírgula.
      [`${address.street}, ${address.number}`, address.complement, address.district, `${address.city}/${address.state}`, formatCep(address.zipCode)]
        .filter(Boolean)
        .join(' · '),
    ],
  ];

  return (
    <div className="rounded-xl bg-white ring-1 ring-zinc-200">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="font-semibold text-zinc-900">{company.tradeName || company.legalName}</h2>
        {company.tradeName && <p className="text-sm text-zinc-500">{company.legalName}</p>}
      </div>
      <dl className="divide-y divide-zinc-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:gap-4">
            <dt className="w-24 shrink-0 text-sm font-medium text-zinc-500">{label}</dt>
            <dd className="text-sm text-zinc-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
