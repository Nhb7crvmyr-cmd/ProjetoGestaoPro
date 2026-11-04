// Página de onboarding: o usuário novo cadastra a empresa (CNPJ) ou a si mesmo (CPF) e vira "Dono".

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router';
import { AddressFields } from '../../../components/ui/AddressFields';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Logo } from '../../../components/ui/Logo';
import { TextField } from '../../../components/ui/TextField';
import { emptyAddress } from '../../../utils/addressSchema';
import { formatCnpj, formatCpf, formatPhone, normalizeDocument, onlyDigits } from '../../../utils/formatters';
import { useSession } from '../../auth/context/SessionContext';
import { signOutUser } from '../../auth/services/authService';
import { DocumentTypeToggle } from '../components/DocumentTypeToggle';
import { useCreateCompany } from '../hooks/useCompany';
import { companyFormSchema, type CompanyFormData } from '../schemas/companySchema';

/**
 * Tela de cadastro da empresa.
 * @returns o formulário de onboarding
 */
export function OnboardingPage() {
  const { user, refreshSession } = useSession();
  const navigate = useNavigate();
  const createCompany = useCreateCompany();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      documentType: 'CNPJ',
      document: '',
      legalName: '',
      tradeName: '',
      email: user.email, // já sugere o e-mail da conta
      phone: '',
      address: emptyAddress,
    },
  });
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  const documentType = watch('documentType');
  const isCnpj = documentType === 'CNPJ';

  // Quem já tem grupo (já fez o onboarding, ou é SuperAdmin) não fica aqui.
  // Exceção: logo após cadastrar com sucesso, quem navega é o onSubmit (levando o aviso de abrir os planos).
  if (user.groups.length > 0 && !createCompany.isSuccess) return <Navigate to="/inicio" replace />;

  /**
   * Troca entre CNPJ e CPF e limpa o documento (as máscaras são diferentes).
   * @param type - tipo escolhido
   */
  function handleTypeChange(type: CompanyFormData['documentType']) {
    setValue('documentType', type);
    setValue('document', '');
    if (type === 'CPF') {
      setValue('tradeName', '');
      // Pessoa física: sugere o nome da conta.
      setValue('legalName', user.name);
    }
  }

  /**
   * Envia o cadastro, renova o token (para receber o grupo "Dono") e vai para o início,
   * já abrindo o popup de planos.
   * @param data - dados validados do formulário
   */
  async function onSubmit(data: CompanyFormData) {
    setErrorMessage(null);
    try {
      await createCompany.mutateAsync({
        documentType: data.documentType,
        document: normalizeDocument(data.document),
        legalName: data.legalName,
        tradeName: data.tradeName || undefined,
        email: data.email,
        phone: onlyDigits(data.phone),
        // Tira o traço do CEP e manda o complemento só se houver.
        address: { ...data.address, zipCode: onlyDigits(data.address.zipCode), complement: data.address.complement || undefined },
      });
      await refreshSession();
      navigate('/inicio', { replace: true, state: { openPlans: true } });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível cadastrar. Tente novamente.');
    }
  }

  // O campo do documento usa máscara diferente conforme o tipo.
  const documentField = register('document', {
    onChange: (event) => setValue('document', isCnpj ? formatCnpj(event.target.value) : formatCpf(event.target.value)),
  });
  const phoneField = register('phone', {
    onChange: (event) => setValue('phone', formatPhone(event.target.value)),
  });

  return (
    <div className="min-h-dvh">
      <header className="border-b border-white/5 bg-brand-950">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo variant="light" />
          <button
            type="button"
            onClick={async () => {
              await signOutUser();
              navigate('/login', { replace: true });
            }}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-300 ring-1 ring-zinc-700 transition hover:bg-zinc-800 hover:text-white"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-sm font-semibold text-brand-700">Passo 1 de 2</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">Cadastre sua empresa</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Use o CNPJ da empresa ou, se você trabalha como pessoa física, o seu CPF. Depois você escolhe o plano.
        </p>

        {/* FormProvider "compartilha" o formulário com componentes filhos (o AddressFields usa isso). */}
        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-8">
            {errorMessage && <Alert type="error">{errorMessage}</Alert>}

            <DocumentTypeToggle value={documentType} onChange={handleTypeChange} />

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-zinc-900">{isCnpj ? 'Dados da empresa' : 'Seus dados'}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={isCnpj ? 'CNPJ' : 'CPF'}
                  placeholder={isCnpj ? '00.000.000/0000-00' : '000.000.000-00'}
                  // CNPJ novo pode ter letras: no CPF, teclado numérico no celular.
                  inputMode={isCnpj ? 'text' : 'numeric'}
                  error={errors.document?.message}
                  {...documentField}
                />
                <TextField
                  label={isCnpj ? 'Razão social' : 'Nome completo'}
                  autoComplete={isCnpj ? 'organization' : 'name'}
                  error={errors.legalName?.message}
                  {...register('legalName')}
                />
                {isCnpj && (
                  <TextField
                    label="Nome fantasia (opcional)"
                    error={errors.tradeName?.message}
                    {...register('tradeName')}
                  />
                )}
                <TextField
                  label="E-mail de contato"
                  type="email"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <TextField
                  label="Telefone / WhatsApp"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  error={errors.phone?.message}
                  {...phoneField}
                />
              </div>
            </fieldset>

            <AddressFields />

            <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:justify-end">
              <Button type="submit" isLoading={isSubmitting} className="sm:w-auto">
                {isSubmitting ? 'Cadastrando…' : 'Cadastrar e escolher plano'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </main>
    </div>
  );
}
