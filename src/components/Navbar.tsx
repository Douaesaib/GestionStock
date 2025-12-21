
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from './ui/Icon'
import { colors } from './ui/colors'

interface NavbarProps {
    title: string;
    showBackButton?: boolean;
    onBack?: () => void;
}

export function Navbar({ title, showBackButton = true, onBack }: NavbarProps) {
    const navigate = useNavigate()

    const handleBack = () => {
        if (onBack) {
            onBack()
        } else {
            navigate('/dashboard')
        }
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '25px'
        }}>
            <h1 style={{
                color: colors.navy,
                fontSize: '28px',
                fontWeight: '600',
                margin: 0
            }}>
                {title}
            </h1>
            {showBackButton && (
                <button
                    onClick={handleBack}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: colors.grayDark,
                        color: colors.white,
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    <ArrowLeftIcon />
                    Retour
                </button>
            )}
        </div>
    )
}
