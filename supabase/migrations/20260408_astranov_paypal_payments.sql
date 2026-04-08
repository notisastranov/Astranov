create or replace function public.create_wallet_topup(p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount numeric := greatest(coalesce(nullif(p_payload ->> 'amountEur', '')::numeric, 0), 0);
  v_provider text := coalesce(nullif(trim(p_payload ->> 'paymentProvider'), ''), 'paypal');
  v_reference text := nullif(trim(p_payload ->> 'providerReference'), '');
  v_user_id uuid := nullif(p_payload ->> 'userId', '')::uuid;
  v_tx public.wallet_transactions%rowtype;
begin
  if v_amount <= 0 then
    raise exception 'amountEur must be greater than zero';
  end if;

  insert into public.wallet_transactions (
    user_id,
    direction,
    transaction_kind,
    payment_provider,
    provider_reference,
    gross_eur
  )
  values (
    v_user_id,
    'credit',
    'top_up',
    v_provider,
    v_reference,
    v_amount
  )
  returning * into v_tx;

  return jsonb_build_object(
    'id', v_tx.id,
    'grossEur', v_tx.gross_eur,
    'ownerFeeEur', v_tx.owner_fee_eur,
    'netEur', v_tx.net_eur,
    'paymentProvider', v_tx.payment_provider,
    'providerReference', v_tx.provider_reference
  );
end;
$$;

create or replace function public.bind_order_payment_reference(p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := nullif(p_payload ->> 'orderId', '')::uuid;
  v_provider text := coalesce(nullif(trim(p_payload ->> 'paymentProvider'), ''), 'paypal');
  v_reference text := nullif(trim(p_payload ->> 'providerReference'), '');
  v_tx public.wallet_transactions%rowtype;
begin
  if v_order_id is null then
    raise exception 'orderId is required';
  end if;

  update public.wallet_transactions
  set
    payment_provider = v_provider,
    provider_reference = coalesce(v_reference, provider_reference)
  where order_id = v_order_id
    and transaction_kind = 'purchase'
  returning * into v_tx;

  if v_tx.id is null then
    raise exception 'Purchase transaction not found for order %', v_order_id;
  end if;

  insert into public.order_events (
    order_id,
    event_kind,
    event_text,
    payload
  )
  values (
    v_order_id,
    'payment_captured',
    'Payment captured through ' || v_provider || '.',
    jsonb_build_object(
      'paymentProvider', v_provider,
      'providerReference', v_reference
    )
  );

  return jsonb_build_object(
    'orderId', v_order_id,
    'paymentProvider', v_tx.payment_provider,
    'providerReference', v_tx.provider_reference,
    'grossEur', v_tx.gross_eur,
    'ownerFeeEur', v_tx.owner_fee_eur,
    'netEur', v_tx.net_eur
  );
end;
$$;

grant execute on function public.create_wallet_topup(jsonb) to anon, authenticated;
grant execute on function public.bind_order_payment_reference(jsonb) to anon, authenticated;
