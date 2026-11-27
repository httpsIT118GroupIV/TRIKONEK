import { useState } from 'react';

export default function Sheet({ title, children, forceOpen = false }) {
  const [open, setOpen] = useState(true);
  const shown = open || forceOpen;
  return (
    <div className="pointer-events-auto mx-auto max-w-md overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.18)]">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full flex-col items-center px-4 pb-2 pt-2.5">
        <span className="h-1.5 w-10 rounded-full bg-gray-300" />
        <span className="mt-2 flex w-full items-center justify-between text-left">
          <span className="text-base font-extrabold">{title}</span>
          <span className="text-gray-400">{shown ? '⌄' : '⌃'}</span>
        </span>
      </button>
      <div
        className={
          (shown ? 'max-h-[46dvh] overflow-y-auto px-4 pb-4 ' : 'hidden ') +
          '[&>.card]:max-h-none [&>.card]:overflow-visible [&>.card]:border-0 [&>.card]:p-0 [&>.card]:shadow-none'
        }
      >
        {children}
      </div>
    </div>
  );
}