import React from 'react'

export function MobileWrapper({ children, background = '#f7fafc' }: { children: React.ReactNode; background?: string }) {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '100vh',
            backgroundColor: background,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {children}
        </div>
    )
}
