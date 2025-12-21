import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MobileWrapper } from '../components/ui/Wrapper'
import { colors } from '../components/ui/colors'
import { LockIcon } from '../components/ui/Icon'

export function LoginPage() {
    const [id, setId] = useState('')
    const navigate = useNavigate()

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (id === '2006') {
            navigate('/dashboard')
        } else {
            alert('ID incorrect. Veuillez entrer le bon ID.')
        }
    }

    return (
        <MobileWrapper background={`linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyLight} 100%)`}>
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
            }}>
                <div style={{
                    background: colors.white,
                    padding: '40px 30px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '30px',
                        color: colors.navy
                    }}>
                        <LockIcon />
                    </div>
                    <h1 style={{
                        textAlign: 'center',
                        marginBottom: '30px',
                        color: colors.navy,
                        fontSize: '28px',
                        fontWeight: '600'
                    }}>
                        Connexion
                    </h1>
                    <form onSubmit={handleLogin}>
                        <input
                            type="text"
                            placeholder="Entrez votre ID"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px',
                                fontSize: '16px',
                                borderRadius: '10px',
                                border: `2px solid ${colors.grayLight}`,
                                marginBottom: '20px',
                                boxSizing: 'border-box',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = colors.navy}
                            onBlur={(e) => e.currentTarget.style.borderColor = colors.grayLight}
                        />
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '16px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: colors.white,
                                background: colors.navy,
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = colors.navyLight}
                            onMouseOut={(e) => e.currentTarget.style.background = colors.navy}
                        >
                            Se connecter
                        </button>
                    </form>
                </div>
            </div>
        </MobileWrapper>
    )
}
