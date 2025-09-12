'use client';
import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '../lib/supabaseClient'; // relativo (cart -> lib)

type Phase = 'phone' | 'code' | 'details' | 'ready';

interface Details {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

const emptyDetails: Details = {
  full_name: '',
  email: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: ''
};

export default function CartAuthFlow({ onProfileReady }: { onProfileReady?: (profile: any) => void }) {
  const supabase = getSupabaseBrowser();
  const [phase, setPhase] = useState<Phase>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setDetails(d => ({
          ...d,
            email: user.email || d.email,
            phone: user.phone || d.phone
        }));
        setPhase('details');
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) setUserId(session.user.id);
      else setUserId(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  function setError(e: string) { setMsg(e); }

  async function sendOtp() {
    setError('');
    if (!phone.startsWith('+')) return setError('Formato internacional: +52...');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone, options: { channel: 'sms' } });
      if (error) return setError(error.message);
      setPhase('code');
    } finally { setLoading(false); }
  }

  async function verifyCode() {
    setError('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
      if (error) return setError(error.message);
      if (!data?.user) return setError('No se obtuvo usuario.');
      setUserId(data.user.id);
      setDetails(d => ({ ...d, phone }));
      setPhase('details');
    } finally { setLoading(false); }
  }

  async function saveDetails() {
    setError('');
    const required: (keyof Details)[] = ['full_name','email','address_line1','city','postal_code','country'];
    for (const k of required) if (!details[k]) return setError('Completa todos los campos obligatorios.');
    setLoading(true);
    try {
      await supabase.auth.updateUser({
        data: { full_name: details.full_name, phone: details.phone }
      });
      const { error } = await supabase.rpc('save_checkout_profile', {
        p_full_name: details.full_name,
        p_email: details.email,
        p_phone: details.phone,
        p_address_line1: details.address_line1,
        p_address_line2: details.address_line2 || null,
        p_city: details.city,
        p_state: details.state,
        p_postal_code: details.postal_code,
        p_country: details.country
      });
      if (error) return setError(error.message);
      setPhase('ready');
      onProfileReady?.(true);
    } finally { setLoading(false); }
  }

  async function activarMembresia(planId: string) {
    if (!userId) return setError('No hay usuario.');
    setLoading(true);
    try {
      const res = await fetch('/api/membership/activate', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ user_id: userId, plan_id: planId })
      });
      const json = await res.json();
      if (!res.ok) return setError(json.error || 'Error activando membresía');
      setMsg('Membresía activada.');
    } finally { setLoading(false); }
  }

  function input(name: keyof Details, label: string, required?: boolean) {
    return (
      <div style={{ marginBottom: 8 }} key={name}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>
          {label}{required && <span style={{ color: 'red' }}> *</span>}
        </label>
        <input
          style={{ width:'100%', padding:8, border:'1px solid #ccc', borderRadius:6 }}
          value={details[name]}
          onChange={e => setDetails(d => ({ ...d, [name]: e.target.value }))}
          placeholder={label}
        />
      </div>
    );
  }

  return (
    <div style={{ border:'1px solid #ddd', padding:16, borderRadius:12, maxWidth:460 }}>
      <h3 style={{ marginTop:0 }}>Acceso rápido y datos</h3>
      {msg && <div style={{ color: msg.startsWith('Error') ? 'crimson':'#444', marginBottom:8 }}>{msg}</div>}

      {phase === 'phone' && (
        <>
          <input
            style={{ width:'100%', padding:10, border:'1px solid #ccc', borderRadius:6, marginBottom:8 }}
            placeholder="+52..."
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <button
            onClick={sendOtp}
            disabled={loading}
            style={{ width:'100%', padding:12, background:'#111', color:'#fff', borderRadius:6 }}
          >
            {loading ? 'Enviando...' : 'Enviar código'}
          </button>
        </>
      )}

      {phase === 'code' && (
        <>
          <input
            style={{ width:'100%', padding:10, border:'1px solid #ccc', borderRadius:6, marginBottom:8 }}
            placeholder="Código SMS"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <button
            onClick={verifyCode}
            disabled={loading}
            style={{ width:'100%', padding:12, background:'#111', color:'#fff', borderRadius:6 }}
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
          <button
            type="button"
            onClick={() => setPhase('phone')}
            style={{ marginTop:6, width:'100%', padding:10, background:'#eee', borderRadius:6 }}
          >
            Cambiar teléfono
          </button>
        </>
      )}

      {phase === 'details' && (
        <>
          {input('full_name','Nombre completo',true)}
          {input('email','Email',true)}
          {input('phone','Teléfono')}
          {input('address_line1','Dirección línea 1',true)}
          {input('address_line2','Dirección línea 2')}
          {input('city','Ciudad',true)}
          {input('state','Estado / Provincia')}
          {input('postal_code','Código Postal',true)}
          {input('country','País',true)}
          <button
            onClick={saveDetails}
            disabled={loading}
            style={{ width:'100%', padding:12, background:'#111', color:'#fff', borderRadius:6, marginTop:4 }}
          >
            {loading ? 'Guardando...' : 'Guardar datos'}
          </button>
        </>
      )}

      {phase === 'ready' && (
        <>
          <div style={{ marginBottom:12, background:'#f5f5f5', padding:10, borderRadius:6 }}>
            Datos guardados. Continúa con el pago y luego activa tu membresía.
          </div>
            <button
              onClick={() => activarMembresia('pro')}
              disabled={loading}
              style={{ width:'100%', padding:12, background:'#0a7', color:'#fff', borderRadius:6 }}
            >
              {loading ? 'Procesando...' : 'Activar membresía (demo)'}
            </button>
        </>
      )}
    </div>
  );
}
