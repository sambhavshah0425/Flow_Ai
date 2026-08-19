import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Cpu } from 'lucide-react';
import './AuthPage.css';

function FieldIcon({ children }) {
  return <span className="fa-field-icon" aria-hidden="true">{children}</span>;
}

function AuthField({
  label,
  type = 'text',
  value,
  onChange,
  required = true,
  icon,
  rightElement,
  autoComplete
}) {
  return (
    <div className={`fa-field-wrapper slide-element${value ? ' field-filled' : ''}`}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={
          autoComplete ||
          (type === 'password'
            ? 'current-password'
            : type === 'email'
              ? 'email'
              : 'off')
        }
      />
      <label>{label}</label>
      {rightElement ?? (icon ? <FieldIcon>{icon}</FieldIcon> : null)}
    </div>
  );
}

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const EyeIcon = ({ open }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );

export function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { login, register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSubmitted(false);
    let success = false;

    if (mode === 'login') {
      success = await login(form.email.trim(), form.password.trim());
    } else {
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      success = await register(fullName, form.email.trim(), form.password.trim());
    }

    if (success) {
      setSubmitted(true);
      setTimeout(() => navigate('/dashboard'), 600);
    }
  };

  const switchToSignup = (e) => {
    e.preventDefault();
    clearError();
    setSubmitted(false);
    setMode('signup');
  };

  const switchToLogin = (e) => {
    e.preventDefault();
    clearError();
    setSubmitted(false);
    setMode('login');
  };

  const passwordToggle = (
    <button
      type="button"
      className="fa-toggle-pass"
      onClick={() => setShowPass(!showPass)}
      aria-label={showPass ? 'Hide password' : 'Show password'}
    >
      <EyeIcon open={showPass} />
    </button>
  );

  return (
    <div className="fa-page">
      <div className="fa-brand">
        <div className="fa-brand-icon" aria-hidden="true">
          <Cpu size={20} />
        </div>
        <span className="fa-brand-text">FlowForge OS</span>
      </div>

      <div className={`fa-auth-wrapper${mode === 'signup' ? ' toggled' : ''}`}>
        <div className="fa-background-shape" aria-hidden="true" />
        <div className="fa-secondary-shape" aria-hidden="true" />

        {/* Login panel */}
        <div className="fa-credentials-panel signin">
          <h2 className="slide-element">Sign In</h2>

          {submitted && mode === 'login' && (
            <p className="fa-success-banner">Login successful!</p>
          )}

          <form onSubmit={handleSubmit}>
            <AuthField
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              icon={<MailIcon />}
              autoComplete="username"
            />
            <AuthField
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              rightElement={passwordToggle}
              autoComplete="current-password"
            />

            {error && mode === 'login' && (
              <div className="fa-field-wrapper slide-element" style={{ height: 'auto', marginTop: 14 }}>
                <p className="fa-error-banner">{error}</p>
              </div>
            )}

            <div className="fa-field-wrapper slide-element">
              <button className="fa-submit-button" type="submit" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In to Workspace'}
              </button>
            </div>

            <div className="fa-switch-link slide-element">
              <p>
                Don&apos;t have an account?
                <br />
                <a href="#" className="register-trigger" onClick={switchToSignup}>Sign Up</a>
              </p>
            </div>
          </form>
        </div>

        <div className="fa-welcome-section signin">
          <h2 className="slide-element">Welcome Back</h2>
          <p className="slide-element">Sign in to keep building and running your AI-powered workflows.</p>
        </div>

        {/* Register panel */}
        <div className="fa-credentials-panel signup">
          <h2 className="slide-element">Register</h2>

          {submitted && mode === 'signup' && (
            <p className="fa-success-banner">Account created!</p>
          )}

          <form onSubmit={handleSubmit}>
            <AuthField
              label="First Name"
              value={form.firstName}
              onChange={set('firstName')}
              icon={<UserIcon />}
              autoComplete="given-name"
            />
            <AuthField
              label="Last Name"
              value={form.lastName}
              onChange={set('lastName')}
              icon={<UserIcon />}
              autoComplete="family-name"
            />
            <AuthField
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              icon={<MailIcon />}
              autoComplete="email"
            />
            <AuthField
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              rightElement={passwordToggle}
              autoComplete="new-password"
            />

            {error && mode === 'signup' && (
              <div className="fa-field-wrapper slide-element" style={{ height: 'auto', marginTop: 14 }}>
                <p className="fa-error-banner">{error}</p>
              </div>
            )}

            <div className="fa-field-wrapper slide-element">
              <button className="fa-submit-button" type="submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Developer Account'}
              </button>
            </div>

            <div className="fa-switch-link slide-element">
              <p>
                Already have an account?
                <br />
                <a href="#" className="login-trigger" onClick={switchToLogin}>Sign In</a>
              </p>
            </div>
          </form>
        </div>

        <div className="fa-welcome-section signup">
          <h2 className="slide-element">Start Automating</h2>
          <p className="slide-element">Build agentic AI workflows visually, run them, and watch them execute live.</p>
        </div>
      </div>
    </div>
  );
}