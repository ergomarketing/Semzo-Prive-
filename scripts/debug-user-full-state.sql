-- Debug full state for user 34624239394
-- Shows: profile, membership_intents, user_memberships, identity_verifications

SELECT 
  'PROFILE' as table_name,
  json_build_object(
    'id', p.id,
    'email', p.email,
    'phone', p.phone,
    'full_name', p.full_name,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'identity_verified', p.identity_verified,
    'membership_status', p.membership_status,
    'membership_type', p.membership_type,
    'shipping_address', p.shipping_address,
    'shipping_city', p.shipping_city,
    'created_at', p.created_at::text
  ) as data
FROM profiles p
WHERE p.phone LIKE '%624239394%'

UNION ALL

SELECT 
  'MEMBERSHIP_INTENTS' as table_name,
  json_agg(
    json_build_object(
      'id', mi.id,
      'status', mi.status,
      'membership_type', mi.membership_type,
      'billing_cycle', mi.billing_cycle,
      'amount', mi.amount,
      'stripe_payment_intent_id', mi.stripe_payment_intent_id,
      'stripe_verification_session_id', mi.stripe_verification_session_id,
      'paid_at', mi.paid_at::text,
      'profile_data', mi.profile_data,
      'created_at', mi.created_at::text
    )
    ORDER BY mi.created_at DESC
  ) as data
FROM profiles p
LEFT JOIN membership_intents mi ON mi.user_id = p.id
WHERE p.phone LIKE '%624239394%'
GROUP BY p.id

UNION ALL

SELECT 
  'USER_MEMBERSHIPS' as table_name,
  json_agg(
    json_build_object(
      'id', um.id,
      'membership_type', um.membership_type,
      'billing_cycle', um.billing_cycle,
      'status', um.status,
      'start_date', um.start_date::text,
      'end_date', um.end_date::text,
      'stripe_subscription_id', um.stripe_subscription_id,
      'created_at', um.created_at::text
    )
    ORDER BY um.created_at DESC
  ) as data
FROM profiles p
LEFT JOIN user_memberships um ON um.user_id = p.id
WHERE p.phone LIKE '%624239394%'
GROUP BY p.id

UNION ALL

SELECT 
  'IDENTITY_VERIFICATIONS' as table_name,
  json_agg(
    json_build_object(
      'id', iv.id,
      'status', iv.status,
      'verification_session_id', iv.verification_session_id,
      'verified_at', iv.verified_at::text,
      'created_at', iv.created_at::text
    )
    ORDER BY iv.created_at DESC
  ) as data
FROM profiles p
LEFT JOIN identity_verifications iv ON iv.user_id = p.id
WHERE p.phone LIKE '%624239394%'
GROUP BY p.id;
