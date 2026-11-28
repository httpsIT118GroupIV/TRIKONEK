import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';
import useDemoSim from '../demo/useDemoSim';
import { DemoPassenger, DemoDriver } from '../demo/DemoViews';

// Ang role na ipinapakita sa bawat hakbang
const STEPS = [
  { role: 'passenger' }, // 1 lahat ng active
  { role: 'passenger' }, // 2 paparating lang
  { role: 'passenger' }, // 3 may naghihintay
  { role: 'passenger' }, // 4 mag-rent
  { role: 'driver' },    // 5 nakikita ng driver
  { role: 'driver' },    // 6 tatanggapin
  { role: 'passenger' }, // 7 kumpirmado
  { role: 'driver' },    // 8 ruta sa mapa
  { role: 'passenger' }, // 9 bayad
];

function useIsDesktop() {
  const q = '(min-width: 1024px)';
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const f = () => setM(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return m;
}

function Phone({ label, desktop, active, children }) {
  return (
    <div className="mx-auto w-full max-w-[400px]">
      {desktop && (
        <p className={'mb-2 text-center text-sm font-extrabold ' + (active ? '' : 'text-gray-400')}>{label}</p>
      )}
      <div
        className={
          'relative overflow-hidden bg-brand-soft transition ' +
          (desktop
            ? 'h-[760px] rounded-[2.2rem] border-[10px] border-ink shadow-2xl '
            : 'h-[72dvh] min-h-[460px] rounded-2xl border border-black/10 shadow ') +
          (desktop && active ? 'ring-4 ring-brand-dark' : '')
        }
        // Dahil dito, nasa loob lang ng "phone" ang mga pop-up na fixed
        style={{ transform: 'translateZ(0)' }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Demo() {
  const { t } = useLang();
  const desktop = useIsDesktop();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('passenger');
  const [payId, setPayId] = useState(null);
  const [runId, setRunId] = useState(0);

  const go = (i) => setStep((s) => Math.max(s, i));
  const sim = useDemoSim((e) => {
    if (e === 'signal') go(3);
    if (e === 'rental') go(4);
    if (e === 'accepted') go(6);
    if (e === 'route') go(7);
  });

  useEffect(() => { setRole(STEPS[step].role); }, [step]);

  function next() {
    if (step === 2) sim.ensureSignal();
    if (step === 3) sim.ensureRental();
    if (step === 5) sim.ensureAccepted();
    if (step === 7) sim.ensureRoute();
    setStep(Math.min(step + 1, STEPS.length - 1));
  }

  function restart() {
    sim.reset();
    setStep(0);
    setPayId(null);
    setRunId((n) => n + 1);
  }

  const stepRole = STEPS[step].role;
  const last = step === STEPS.length - 1;

  const passenger = <DemoPassenger key={`p${runId}`} sim={sim} step={step} payId={payId} setPayId={setPayId} />;
  const driver = <DemoDriver key={`d${runId}`} sim={sim} step={step} />;

  return (
    <div className="min-h-screen bg-brand-soft pb-10">
      <header className="bg-brand px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛺</span>
            <span className="text-lg font-extrabold tracking-tight">{t('app.name')}</span>
            <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">DEMO</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link to="/login" className="flex h-9 items-center rounded-full bg-white/70 px-3 text-sm font-bold">
              {t('login.button')}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 pt-4">
        <p className="rounded-xl bg-amber-50 px-4 py-2 text-xs font-medium text-accent">{t('dm.badge')}</p>

        <section className="card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-accent">
              {t('dm.step').replace('{n}', step + 1).replace('{total}', STEPS.length)}
            </p>
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold">
              {stepRole === 'passenger' ? `🧍 ${t('dm.passenger')}` : `🛺 ${t('dm.driver')}`}
            </span>
          </div>
          <h2 className="text-xl font-extrabold leading-tight">{t(`dn.s${step + 1}.t`)}</h2>
          <p className="text-sm text-gray-600">{t(`dn.s${step + 1}.d`)}</p>

          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={'h-1.5 flex-1 rounded-full ' + (i <= step ? 'bg-brand-dark' : 'bg-gray-200')} />
            ))}
          </div>

          {last ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <button className="btn-ghost" onClick={restart}>↺ {t('dm.restart')}</button>
              <Link to="/register" className="btn-primary flex items-center justify-center">{t('dm.register')}</Link>
              <Link to="/login" className="btn-dark flex items-center justify-center">{t('login.button')}</Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <button className="btn-ghost" onClick={restart}>↺ {t('dm.restart')}</button>
              <button className="btn-primary col-span-2" onClick={next}>{t('dm.next')} →</button>
            </div>
          )}
        </section>

        {!desktop && (
          <div className="grid grid-cols-2 gap-2">
            {[['passenger', `🧍 ${t('dm.passenger')}`], ['driver', `🛺 ${t('dm.driver')}`]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setRole(id)}
                aria-pressed={role === id}
                className={
                  'rounded-2xl px-2 py-3 text-sm font-bold transition active:scale-[0.98] ' +
                  (role === id ? 'bg-ink text-white shadow' : 'bg-white text-ink')
                }
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {desktop ? (
          <div className="grid grid-cols-2 gap-6">
            <Phone desktop label={`🧍 ${t('dm.passenger')}`} active={stepRole === 'passenger'}>{passenger}</Phone>
            <Phone desktop label={`🛺 ${t('dm.driver')}`} active={stepRole === 'driver'}>{driver}</Phone>
          </div>
        ) : (
          // Parehong naka-mount para hindi mawala ang napili sa bawat screen
          <Phone>
            <div className={'absolute inset-0 ' + (role === 'passenger' ? '' : 'invisible')}>{passenger}</div>
            <div className={'absolute inset-0 ' + (role === 'driver' ? '' : 'invisible')}>{driver}</div>
          </Phone>
        )}

        <p className="text-center text-xs text-gray-500">{t('dm.note')}</p>
      </main>
    </div>
  );
}