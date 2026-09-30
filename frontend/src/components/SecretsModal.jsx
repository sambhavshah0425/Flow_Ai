import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Key, Lock, Trash2, Plus, ShieldCheck, X } from 'lucide-react';

export function SecretsModal({ isOpen, onClose }) {
  const [secrets, setSecrets] = useState([]);
  const [keyName, setKeyName] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSecrets = async () => {
    try {
      const res = await api.get('/secrets');
      setSecrets(res.data.secrets || []);
    } catch (err) {
      console.error('Fetch secrets error:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSecrets();
    }
  }, [isOpen]);

  const handleAddSecret = async (e) => {
    e.preventDefault();
    if (!keyName || !keyValue) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/secrets', { key: keyName, value: keyValue });
      setKeyName('');
      setKeyValue('');
      await fetchSecrets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save secret');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSecret = async (key) => {
    try {
      await api.delete(`/secrets/${key}`);
      await fetchSecrets();
    } catch (err) {
      console.error('Delete secret error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 w-full max-w-md rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-700 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Encrypted Secrets Vault</h3>
              <p className="text-xs text-slate-400">AES-256 encrypted environment variables</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Secret Form */}
        <form onSubmit={handleAddSecret} className="space-y-3 mb-6 bg-dark-900/60 p-4 rounded-xl border border-dark-700/60">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Secret Key Name (e.g. SMTP_PASS)</label>
            <input
              type="text"
              placeholder="SMTP_PASS"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value.toUpperCase())}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-brand-500 font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Secret Token / Value</label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              required
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            {loading ? 'Encrypting & Saving...' : 'Save Secret to Vault'}
          </button>
        </form>

        {/* Secrets List */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Saved Vault Keys ({secrets.length})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {secrets.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">No secrets stored yet. Variables can be referenced as &#123;&#123;secrets.KEY&#125;&#125; in nodes.</p>
            ) : (
              secrets.map((sec) => (
                <div key={sec.key} className="flex items-center justify-between bg-dark-700/40 px-3 py-2 rounded-lg border border-dark-700">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-xs font-medium text-slate-200">{sec.key}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteSecret(sec.key)}
                    className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
