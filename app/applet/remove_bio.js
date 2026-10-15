const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove biometric state & useEffect & handleBiometricLogin
const targetFunc = `  // Biometric login state & WebAuthn handler
  const [hasBiometricSaved, setHasBiometricSaved] = useState(false);
  const [biometricUser, setBiometricUser] = useState<any>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mece_biometric_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.nome) {
          setHasBiometricSaved(true);
          setBiometricUser(parsed);
          // SEGURANÇA: NUNCA executa login automático aqui!
          // O usuário precisa obrigatoriamente acionar o botão e passar pelo sensor biométrico (digital/face).
        }
      }
    } catch (e) {}
  }, []);
  const handleBiometricLogin = async () => {
    setError("");
    try {
      if (!biometricUser) {
        setError("Nenhum dado salvo para biometria neste aparelho. Faça o login com sua senha uma vez primeiro.");
        return;
      }
      // Validação Biométrica Real via WebAuthn nativo do sistema operacional / aparelho (Face ID, Touch ID, Digital)
      if (typeof window !== "undefined" && window.PublicKeyCredential) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          // Solicita obrigatoriamente a verificação do usuário através do sensor biométrico nativo do aparelho
          await navigator.credentials.get({
            publicKey: {
              challenge,
              timeout: 60000,
              userVerification: "required",
              rpId: window.location.hostname || undefined,
            },
          });
        } catch (bioErr: any) {
          console.warn("Validação biométrica não concluída:", bioErr);
          if (bioErr.name === "NotAllowedError" || bioErr.name === "AbortError") {
            setError("Autenticação biométrica cancelada ou não reconhecida. Por favor, digite sua senha.");
            return;
          }
          setError("Sensor biométrico não autorizado ou indisponível neste navegador. Digite sua senha.");
          return;
        }
      } else {
        setError("Este aparelho ou navegador não possui suporte a autenticação biométrica nativa.");
        return;
      }
      // Somente após o sensor biométrico ser APROVADO fisicamente no aparelho:
      setLocalNome(biometricUser.nome);
      setLocalTelefone(biometricUser.telefone);
      if (biometricUser.senha) setSenha(biometricUser.senha);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: biometricUser.nome,
          telefone: biometricUser.telefone,
          senha: biometricUser.senha || "",
        }),
      });
      const data = await response.json();
      if (response.ok) {
        onLogin(data.user || biometricUser);
        return;
      } else {
        setError(data.error || "Erro ao realizar acesso por biometria.");
      }
    } catch (err) {
      console.error("Erro na autenticação biométrica:", err);
      setError("Erro ao autenticar por biometria. Digite sua senha.");
    }
  };`;

if (content.includes(targetFunc)) {
  content = content.replace(targetFunc, '');
  console.log("Removed biometric functions successfully.");
} else {
  console.log("Target function not found exactly.");
}

// Remove biometric button JSX
const targetBtn = `            {/* Botão de Acesso por Biometria / Face ID */}
            {hasBiometricSaved && (
              <button
                type="button"
                onClick={handleBiometricLogin}
                style={{
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  boxShadow: '0 8px 24px rgba(217, 119, 6, 0.3)'
                }}
                className="w-full py-3.5 px-6 rounded-full text-white font-bold text-sm tracking-wide transition-all duration-200 active:scale-[0.99] hover:brightness-110 cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <Fingerprint className="w-5 h-5 text-amber-100" />
                Entrar com Biometria / Face ID
              </button>
            )}`;

if (content.includes(targetBtn)) {
  content = content.replace(targetBtn, '');
  console.log("Removed biometric button successfully.");
} else {
  console.log("Target button not found exactly.");
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log("App.tsx updated.");
