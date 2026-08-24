import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'pro' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'grad-hero text-white shadow-soft',
  pro: 'grad-premium text-white shadow-soft',
  ghost: 'bg-transparent text-ink-dim font-medium shadow-none',
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`w-full rounded-2xl py-3.5 text-sm font-semibold text-center transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
