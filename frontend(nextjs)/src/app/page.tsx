'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './page.module.css';

export default function Home() {
  const { login, error, clearError, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !username) return;
    clearError();
    login(email, name, username.trim().toLowerCase());
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    clearError();
    window.location.href = `${API_URL}/auth/${provider}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Minimal Chat</h1>
          <p className={styles.subtitle}>Sign in to start messaging &amp; calling</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <span>{error}</span>
            <button className={styles.errorClose} onClick={clearError} aria-label="Dismiss">✕</button>
          </div>
        )}

        {/* Developer Bypass Login Form */}
        <form onSubmit={handleDevLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              placeholder="e.g. john_doe"
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearError(); }}
              className={styles.input}
              pattern="^[a-zA-Z0-9_]{3,15}$"
              title="Username must be 3-15 alphanumeric characters or underscores"
              required
              disabled={loading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Display Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => { setName(e.target.value); clearError(); }}
              className={styles.input}
              required
              disabled={loading}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              className={styles.input}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Signing in...' : 'Dev Bypass Login'}
          </button>
        </form>

        <div className={styles.divider}>Or connect via</div>

        {/* Social Logins */}
        <div className={styles.oauthContainer}>
          <button onClick={() => handleOAuth('google')} className={styles.btnOauth} disabled={loading}>
            Continue with Google
          </button>
          <button onClick={() => handleOAuth('github')} className={styles.btnOauth} disabled={loading}>
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
