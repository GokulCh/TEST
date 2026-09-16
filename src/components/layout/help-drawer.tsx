"use client"

import { useState } from "react"

export function HelpDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-colors"
        aria-label="Help"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 right-0 z-50 w-80 border-l border-border-subtle bg-panel-bg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold">Help</h2>
              <button onClick={() => setOpen(false)} className="text-fg-muted hover:text-fg-default">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-fg-muted">
              Documentation and support resources will appear here.
            </p>
          </aside>
        </>
      )}
    </>
  )
}
