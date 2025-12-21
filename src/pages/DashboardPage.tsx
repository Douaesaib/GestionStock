import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { MobileWrapper } from '../components/ui/Wrapper'
import { colors } from '../components/ui/colors'
import { BoxIcon, UsersIcon, ShoppingCartIcon, FileTextIcon, ArrowLeftIcon } from '../components/ui/Icon'
import type { Sale } from '../types/models'

export function DashboardPage() {
    const navigate = useNavigate()
    const [totalProducts, setTotalProducts] = useState(0)
    const [totalClients, setTotalClients] = useState(0)
    const [todaySales, setTodaySales] = useState(0)
    const [todayProfit, setTodayProfit] = useState(0)

    useEffect(() => {
        // Get total products
        const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
            setTotalProducts(snapshot.size)
        })

        // Get total clients
        const unsubscribeClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
            setTotalClients(snapshot.size)
        })

        // Get today's sales and calculate profit
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayTimestamp = Timestamp.fromDate(today)

        const unsubscribeSales = onSnapshot(
            query(collection(db, 'sales'), where('date', '>=', todayTimestamp), where('status', '==', 'Completed')),
            (snapshot) => {
                setTodaySales(snapshot.size)
                // Calculate total profit from today's sales
                const totalProfit = snapshot.docs.reduce((sum, doc) => {
                    const sale = doc.data() as Sale
                    return sum + (sale.totalProfit || 0)
                }, 0)
                setTodayProfit(totalProfit)
            }
        )

        return () => {
            unsubscribeProducts()
            unsubscribeClients()
            unsubscribeSales()
        }
    }, [])

    const menuItems = [
        { id: 'stock', title: 'Stock', icon: BoxIcon, color: colors.success, route: '/stock' },
        { id: 'clients', title: 'Clients', icon: UsersIcon, color: colors.info, route: '/clients' },
        { id: 'sales', title: 'Ventes', icon: ShoppingCartIcon, color: colors.warning, route: '/sales' },
        { id: 'invoices', title: 'Factures', icon: FileTextIcon, color: colors.navyLight, route: '/invoices' },
        { id: 'returns', title: 'Retours', icon: ArrowLeftIcon, color: colors.danger, route: '/returns' }
    ]

    return (
        <MobileWrapper>
            <div style={{
                height: '100vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch'
            }}>
                <div style={{
                    padding: '20px',
                    paddingBottom: '40px'
                }}>
                    <h1 style={{
                        textAlign: 'center',
                        marginBottom: '30px',
                        color: colors.navy,
                        fontSize: '32px',
                        fontWeight: '600'
                    }}>
                        Tableau de Bord
                    </h1>

                    {/* Summary Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '15px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            background: colors.white,
                            padding: '20px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            textAlign: 'center',
                            border: `1px solid ${colors.grayLight}`
                        }}>
                            <div style={{ color: colors.grayDark, fontSize: '14px', marginBottom: '8px' }}>Produits</div>
                            <div style={{ color: colors.navy, fontSize: '28px', fontWeight: '600' }}>{totalProducts}</div>
                        </div>
                        <div style={{
                            background: colors.white,
                            padding: '20px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            textAlign: 'center',
                            border: `1px solid ${colors.grayLight}`
                        }}>
                            <div style={{ color: colors.grayDark, fontSize: '14px', marginBottom: '8px' }}>Clients</div>
                            <div style={{ color: colors.navy, fontSize: '28px', fontWeight: '600' }}>{totalClients}</div>
                        </div>
                        <div style={{
                            background: colors.white,
                            padding: '20px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            textAlign: 'center',
                            border: `1px solid ${colors.grayLight}`
                        }}>
                            <div style={{ color: colors.grayDark, fontSize: '14px', marginBottom: '8px' }}>Ventes Aujourd'hui</div>
                            <div style={{ color: colors.navy, fontSize: '28px', fontWeight: '600' }}>{todaySales}</div>
                        </div>
                        <div style={{
                            background: colors.white,
                            padding: '20px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            textAlign: 'center',
                            border: `1px solid ${colors.grayLight}`
                        }}>
                            <div style={{ color: colors.grayDark, fontSize: '14px', marginBottom: '8px' }}>Profit Aujourd'hui</div>
                            <div style={{ color: colors.success, fontSize: '28px', fontWeight: '600' }}>{todayProfit.toFixed(2)} DH</div>
                        </div>
                    </div>

                    {/* Menu Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '20px',
                        width: '100%',
                        justifyItems: 'stretch'
                    }}>
                        {menuItems.map(item => {
                            const IconComponent = item.icon
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => navigate(item.route)}
                                    style={{
                                        background: colors.white,
                                        padding: '30px 20px',
                                        borderRadius: '16px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        border: `2px solid ${colors.grayLight}`,
                                        width: '100%',
                                        minHeight: '140px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)'
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'
                                        e.currentTarget.style.borderColor = item.color
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                                        e.currentTarget.style.borderColor = colors.grayLight
                                    }}
                                >
                                    <div style={{
                                        display: 'inline-flex',
                                        color: item.color,
                                        marginBottom: '15px'
                                    }}>
                                        <IconComponent />
                                    </div>
                                    <h2 style={{
                                        color: colors.navy,
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        margin: 0
                                    }}>
                                        {item.title}
                                    </h2>
                                </div>
                            )
                        })}
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            display: 'block',
                            margin: '30px auto 0',
                            padding: '12px 24px',
                            background: colors.grayDark,
                            color: colors.white,
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            width: '100%'
                        }}
                    >
                        Déconnexion
                    </button>
                </div>
            </div>
        </MobileWrapper>
    )
}
