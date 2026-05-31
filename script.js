// =========================================
// CONFIGURAÇÕES E CONSTANTES
// =========================================

const VALID_USER = {
  email: "admin@email.com",
  password: "12345678",
};

const SESSION_KEY = "auth_session";
const THEME_KEY = "preferred_theme";

// =========================================
// UTILITÁRIOS
// =========================================

/** Retorna true se o e-mail tiver formato válido. */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Calcula força da senha (0–4). */
function getPasswordStrength(password) {
  if (password.length === 0) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

/** Aplica ou remove classes de estado num grupo de campo. */
function setFieldState(groupEl, state) {
  groupEl.classList.remove("has-error", "is-valid");
  if (state) groupEl.classList.add(state);
}

/** Exibe mensagem de erro num campo. */
function showFieldError(errorEl, message) {
  errorEl.textContent = message;
}

/** Formata data/hora para exibição na sessão. */
function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =========================================
// GERENCIAMENTO DE TEMA
// =========================================

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = document.getElementById("themeIcon");
  if (!icon) return;
  icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const preferred = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(preferred);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

// =========================================
// LÓGICA DA PÁGINA DE LOGIN
// =========================================

function initLoginPage() {
  // Redireciona se já estiver autenticado
  if (localStorage.getItem(SESSION_KEY)) {
    window.location.replace("dashboard.html");
    return;
  }

  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailGroup = document.getElementById("emailGroup");
  const passwordGroup = document.getElementById("passwordGroup");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const eyeIcon = document.getElementById("eyeIcon");
  const strengthMeter = document.getElementById("strengthMeter");
  const strengthLabel = document.getElementById("strengthLabel");
  const segments = [
    document.getElementById("seg1"),
    document.getElementById("seg2"),
    document.getElementById("seg3"),
    document.getElementById("seg4"),
  ];
  const formFeedback = document.getElementById("formFeedback");
  const submitBtn = document.getElementById("submitBtn");
  const rememberMe = document.getElementById("rememberMe");

  // Preenche e-mail salvo se "Lembrar-me" foi usado
  const rememberedEmail = localStorage.getItem("remembered_email");
  if (rememberedEmail) {
    emailInput.value = rememberedEmail;
    rememberMe.checked = true;
  }

  // --- Mostrar / esconder senha ---
  togglePasswordBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    eyeIcon.className = isPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
  });

  // --- Indicador de força da senha ---
  const strengthLabels = ["", "Fraca", "Razoável", "Boa", "Forte"];
  const strengthClasses = ["", "weak", "fair", "good", "strong"];
  const strengthColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#16a34a"];

  passwordInput.addEventListener("input", () => {
    const val = passwordInput.value;
    const score = getPasswordStrength(val);

    if (val.length === 0) {
      strengthMeter.classList.remove("visible");
      return;
    }

    strengthMeter.classList.add("visible");
    strengthLabel.textContent = strengthLabels[score];
    strengthLabel.style.color = strengthColors[score];

    segments.forEach((seg, i) => {
      seg.className = "strength-segment";
      if (i < score) seg.classList.add(strengthClasses[score]);
    });

    // Limpa erro de senha ao digitar
    if (passwordGroup.classList.contains("has-error")) {
      setFieldState(passwordGroup, null);
      showFieldError(passwordError, "");
    }
  });

  // Limpa erro de e-mail ao digitar
  emailInput.addEventListener("input", () => {
    if (emailGroup.classList.contains("has-error")) {
      setFieldState(emailGroup, null);
      showFieldError(emailError, "");
    }
    hideFeedback();
  });

  // --- Validação e envio do formulário ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFeedback();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let valid = true;

    // Valida e-mail
    if (!email) {
      setFieldState(emailGroup, "has-error");
      showFieldError(emailError, "Por favor, informe seu e-mail.");
      valid = false;
    } else if (!isValidEmail(email)) {
      setFieldState(emailGroup, "has-error");
      showFieldError(emailError, "Formato de e-mail inválido.");
      valid = false;
    } else {
      setFieldState(emailGroup, "is-valid");
      showFieldError(emailError, "");
    }

    // Valida senha
    if (!password) {
      setFieldState(passwordGroup, "has-error");
      showFieldError(passwordError, "Por favor, informe sua senha.");
      valid = false;
    } else if (password.length < 8) {
      setFieldState(passwordGroup, "has-error");
      showFieldError(passwordError, "A senha deve ter pelo menos 8 caracteres.");
      valid = false;
    } else {
      setFieldState(passwordGroup, "is-valid");
      showFieldError(passwordError, "");
    }

    if (!valid) return;

    // Simula carregamento de rede
    setLoading(true);
    await delay(1200);
    setLoading(false);

    // Verifica credenciais
    if (email !== VALID_USER.email || password !== VALID_USER.password) {
      showFeedback("E-mail ou senha incorretos. Tente novamente.", "error");
      setFieldState(emailGroup, "has-error");
      setFieldState(passwordGroup, "has-error");
      return;
    }

    // Login bem-sucedido — salva sessão
    const session = {
      email,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Lembrar e-mail
    if (rememberMe.checked) {
      localStorage.setItem("remembered_email", email);
    } else {
      localStorage.removeItem("remembered_email");
    }

    showFeedback("Login realizado com sucesso! Redirecionando…", "success");
    await delay(900);
    window.location.replace("dashboard.html");
  });

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.classList.toggle("loading", loading);
  }

  function showFeedback(message, type) {
    formFeedback.textContent = message;
    formFeedback.className = `form-feedback show ${type}`;
  }

  function hideFeedback() {
    formFeedback.className = "form-feedback";
  }
}

// =========================================
// LÓGICA DA PÁGINA DE DASHBOARD
// =========================================

function initDashboardPage() {
  const raw = localStorage.getItem(SESSION_KEY);

  // Redireciona se não autenticado
  if (!raw) {
    window.location.replace("index.html");
    return;
  }

  const session = JSON.parse(raw);

  // Exibe e-mail e inicial no avatar
  const emailDisplay = document.getElementById("userEmailDisplay");
  const avatarEl = document.getElementById("avatarInitial");
  const sessionTimeEl = document.getElementById("sessionTime");
  const logoutBtn = document.getElementById("logoutBtn");

  if (emailDisplay) emailDisplay.textContent = session.email;

  if (avatarEl) {
    // Usa a primeira letra do e-mail como inicial
    avatarEl.textContent = session.email.charAt(0).toUpperCase();
  }

  if (sessionTimeEl) {
    sessionTimeEl.textContent = `Sessão iniciada em ${formatDateTime(session.loginAt)}`;
  }

  // Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace("index.html");
  });
}

// =========================================
// UTILITÁRIO: DELAY
// =========================================

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =========================================
// INICIALIZAÇÃO — detecta a página ativa
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  // Botão de tema (presente em ambas as páginas)
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

  // Detecta qual página está carregada pelo elemento-chave
  if (document.getElementById("loginForm")) {
    initLoginPage();
  } else if (document.getElementById("logoutBtn")) {
    initDashboardPage();
  }
});
