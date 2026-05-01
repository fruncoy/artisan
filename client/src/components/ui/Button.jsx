import { cn } from '../../utils/cn'

export function Button({ children, className = '', ...props }) {
  return (
    <button
      className={cn(
        "rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
