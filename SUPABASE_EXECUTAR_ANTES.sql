-- D CHÁCARA EMPÓRIO - CAMADA DE SINCRONIZAÇÃO DO SISTEMA WEB
-- Execute uma vez no SQL Editor do Supabase.

create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.app_state to authenticated;

drop policy if exists "authenticated_app_state" on public.app_state;
create policy "authenticated_app_state"
on public.app_state
for all
to authenticated
using (true)
with check (true);

insert into public.app_state (id, payload)
values ('main', jsonb_build_object(
  'products', jsonb_build_array(),
  'sales', jsonb_build_array(),
  'entries', jsonb_build_array(),
  'expenses', jsonb_build_array(),
  'clients', jsonb_build_array(),
  'debts', jsonb_build_array(),
  'payments', jsonb_build_array(),
  'categories', jsonb_build_array('Rações','Medicamentos','Utensílios','Ferramentas','Jardinagem'),
  'stockAdjustments', jsonb_build_array(),
  'expenseCategories', jsonb_build_array('Fornecedores','Folha','Impostos','Energia','Frete','Manutenção','Outros'),
  'settings', jsonb_build_object(
    'store','D Chácara Empório','cnpj','','phone','','email','','address','','city','Cristalina','state','GO',
    'open','07:00','close','18:00','alerts',true,'alertStock',true,'alertDebts',true,'backup',true,
    'currency','BRL','defaultMinStock',5,'defaultFiadoDays',30,'defaultSeller','Luiz Silva',
    'payPix',true,'payCard',true,'payCash',true,'payBoleto',true,'payFiado',true,'lastBackup',''
  )
))
on conflict (id) do nothing;
