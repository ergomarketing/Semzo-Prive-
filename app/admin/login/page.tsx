const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError("")

  console.log("🔍 Debug Login:")
  console.log("Username ingresado:", username)
  console.log("Username esperado:", ADMIN_CONFIG.username)
  console.log("Password match:", password === ADMIN_CONFIG.password)

  // Verificar credenciales
  if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
    // Guardar sesión
    localStorage.setItem("admin_session", "authenticated")
    localStorage.setItem("admin_login_time", Date.now().toString())
    // Redirigir al panel
    router.push("/admin")
  } else {
    setError(`Credenciales incorrectas. Usuario esperado: ${ADMIN_CONFIG.username}`)
  }

  setLoading(false)
}

