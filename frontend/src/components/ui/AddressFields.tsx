// Bloco de campos de endereço com busca automática pelo CEP (preenche rua, bairro, cidade e estado).
// Reutilizável: funciona em qualquer formulário que tenha um campo "address" (empresa, clientes...).

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { fetchAddressByCep } from '../../services/cepService';
import { UF_LIST, type AddressFormData } from '../../utils/addressSchema';
import { formatCep, onlyDigits } from '../../utils/formatters';
import { SelectField } from './SelectField';
import { TextField } from './TextField';

/** Opções do campo Estado. */
const UF_OPTIONS = UF_LIST.map((uf) => ({ value: uf, label: uf }));

/**
 * Desenha os campos de endereço.
 * Usa useFormContext(): o formulário "pai" precisa estar dentro de um <FormProvider>.
 * Assim este componente acessa register/setValue sem receber tudo por propriedades.
 * @returns os campos de endereço
 */
export function AddressFields() {
  const {
    register,
    setValue,
    setFocus,
    formState: { errors },
  } = useFormContext<{ address: AddressFormData }>();
  const addressErrors = errors.address;

  // Mensagem embaixo do CEP: "Buscando…", "CEP não encontrado"...
  const [cepStatus, setCepStatus] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  /**
   * Busca o endereço quando o CEP fica completo (8 números).
   * @param cep - CEP só com números
   */
  async function lookupCep(cep: string) {
    setCepStatus({ type: 'info', text: 'Buscando endereço…' });
    try {
      const found = await fetchAddressByCep(cep);
      if (!found) {
        setCepStatus({ type: 'error', text: 'CEP não encontrado. Preencha o endereço manualmente.' });
        return;
      }
      // shouldValidate: revalida o campo na hora, apagando mensagens de erro antigas.
      const options = { shouldValidate: true };
      setValue('address.street', found.street, options);
      setValue('address.district', found.district, options);
      setValue('address.city', found.city, options);
      setValue('address.state', found.state as AddressFormData['state'], options);
      setCepStatus(null);
      // Leva o cursor para o número (a única coisa que o CEP não traz).
      setFocus('address.number');
    } catch {
      setCepStatus({ type: 'error', text: 'Não foi possível buscar o CEP agora. Preencha manualmente.' });
    }
  }

  // register(...) aceita opções; "onChange" aqui roda DEPOIS do onChange do próprio React Hook Form.
  const zipCodeField = register('address.zipCode', {
    onChange: (event) => {
      const masked = formatCep(event.target.value);
      setValue('address.zipCode', masked);
      const digits = onlyDigits(masked);
      if (digits.length === 8) void lookupCep(digits);
      else setCepStatus(null);
    },
  });

  return (
    // fieldset + legend: agrupam campos relacionados (bom para acessibilidade).
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold text-zinc-900">Endereço</legend>

      <div className="grid gap-4 sm:grid-cols-6">
        <TextField
          className="sm:col-span-2"
          label="CEP"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          error={addressErrors?.zipCode?.message}
          hint={cepStatus?.type === 'info' ? cepStatus.text : undefined}
          {...zipCodeField}
        />
        {cepStatus?.type === 'error' && (
          <p className="text-xs text-amber-700 sm:col-span-4 sm:self-center sm:pt-6">{cepStatus.text}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-6">
        <TextField
          className="sm:col-span-4"
          label="Rua / Avenida"
          autoComplete="address-line1"
          error={addressErrors?.street?.message}
          {...register('address.street')}
        />
        <TextField
          className="sm:col-span-2"
          label="Número"
          autoComplete="address-line2"
          error={addressErrors?.number?.message}
          {...register('address.number')}
        />
        <TextField
          className="sm:col-span-3"
          label="Complemento (opcional)"
          placeholder="Sala, bloco, apto…"
          error={addressErrors?.complement?.message}
          {...register('address.complement')}
        />
        <TextField
          className="sm:col-span-3"
          label="Bairro"
          error={addressErrors?.district?.message}
          {...register('address.district')}
        />
        <TextField
          className="sm:col-span-4"
          label="Cidade"
          autoComplete="address-level2"
          error={addressErrors?.city?.message}
          {...register('address.city')}
        />
        <SelectField
          className="sm:col-span-2"
          label="Estado"
          placeholder="UF"
          options={UF_OPTIONS}
          error={addressErrors?.state?.message}
          {...register('address.state')}
        />
      </div>
    </fieldset>
  );
}
