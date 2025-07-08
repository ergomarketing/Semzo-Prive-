
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase-direct";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        });
        if (signInError) throw signInError;
        router.push("/dashboard");
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.toLowerCase(),
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              phone,
            },
          },
        });
        if (signUpError) throw signUpError;
        router.push("/verify-email");
      }
    } catch (err: any) {
      setError(err.message || "Error en la autenticación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-10">
      <h2 className="text-center text-3xl font-bold mb-6">
        {isLogin ? "Iniciar sesión" : "Crear cuenta"}
      </h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <form className="space-y-6" onSubmit={handleAuth}>
        {!isLogin && (
          <>
            <Input
              type="text"
              placeholder="Nombre"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Apellido"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <Input
              type="tel"
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </>
        )}
        <Input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <Button type="submit" disabled={isLoading} className="w-full py-2">
          {isLoading
            ? isLogin
              ? "Iniciando sesión..."
              : "Creando cuenta..."
            : isLogin
            ? "Iniciar sesión"
            : "Registrarse"}
        </Button>
      </form>
      <div className="text-center mt-4">
        <button
          onClick={() => setIsLogin((v) => !v)}
          className="text-sm text-indigo-600 hover:underline"
        >
          {isLogin
            ? "¿No tienes cuenta? Regístrate"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </div>
  );
}
