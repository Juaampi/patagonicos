import type { ReactNode } from 'react'

export function AdminShell({ children }: { children: ReactNode }) {
  return <div className="space-y-8">{children}</div>
}
