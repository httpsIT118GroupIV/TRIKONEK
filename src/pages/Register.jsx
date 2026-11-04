import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'commuter', plate: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username, role: form.role, plate_number: form.plate } },
    });
    if (error) return setError(error.message);
    nav('/'); // the router sends them to the right screen
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create account</h2>
      <input placeholder="Username" value={form.username} onChange={set('username')} required />
      <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
      <input type="password" placeholder="Password (min 6)" value={form.password} onChange={set('password')} minLength={6} required />
      <select value={form.role} onChange={set('role')}>
        <option value="commuter">Commuter</option>
        <option value="driver">Tricycle Driver</option>
      </select>
      {form.role === 'driver' && (
        <input placeholder="Tricycle plate number" value={form.plate} onChange={set('plate')} required />
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Register</button>
      <p>Have an account? <Link to="/login">Log in</Link></p>
    </form>
  );
}