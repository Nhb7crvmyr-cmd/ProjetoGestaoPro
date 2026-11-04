// Busca de endereço pelo CEP usando o ViaCEP (serviço público e gratuito, sem chave, sem cadastro).
//
// Atenção: o CEP digitado é enviado ao ViaCEP (serviço externo). Só o CEP vai, nenhum outro dado.

/** Endereço encontrado pelo CEP (o número e o complemento a pessoa digita). */
export interface CepAddress {
  street: string;
  district: string;
  city: string;
  state: string;
}

/** Formato da resposta do ViaCEP (só os campos que usamos). */
interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  /** O ViaCEP responde { erro: true } (ou "true") quando o CEP não existe. */
  erro?: boolean | string;
}

/**
 * Consulta o CEP.
 * @param cep - CEP só com números (8)
 * @returns o endereço, ou null se o CEP não existir
 * @throws Error se o serviço estiver fora do ar ou sem internet
 */
export async function fetchAddressByCep(cep: string): Promise<CepAddress | null> {
  // AbortSignal.timeout cancela a busca se demorar mais de 8 segundos.
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    // CEP com formato errado devolve 400; tratamos como "não encontrado".
    if (response.status === 400) return null;
    throw new Error('Serviço de CEP indisponível.');
  }
  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) return null;

  return {
    street: data.logradouro ?? '',
    district: data.bairro ?? '',
    city: data.localidade ?? '',
    state: data.uf ?? '',
  };
}
