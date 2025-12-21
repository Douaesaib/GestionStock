import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where, doc, writeBatch, increment } from 'firebase/firestore'
import { db } from '../services/firebase'
import { MobileWrapper } from '../components/ui/Wrapper'
import { colors } from '../components/ui/colors'
import { ArrowLeftIcon } from '../components/ui/Icon'
import { Navbar } from '../components/Navbar'
import type { Sale } from '../types/models'

export function ReturnsPage() {

    const [sales, setSales] = useState<Sale[]>([])

    useEffect(() => {
        const unsubscribeSales = onSnapshot(
            query(collection(db, 'sales'), where('status', '==', 'Completed')),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Sale[]
                // Sort by date descending
                data.sort((a, b) => b.date.toMillis() - a.date.toMillis())
                setSales(data)
            }
        )

        return () => {
            unsubscribeSales()
        }
    }, [])

    const handleReturn = async (sale: Sale) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir retourner cette vente de ${sale.clientName}?`)) {
            return
        }

        try {
            // Create a batch for atomic operations
            const batch = writeBatch(db)

            // Read items from the sale being returned
            const saleItems = sale.items || []

            // For each item in the sale, increment the product stock
            for (const item of saleItems) {
                const productRef = doc(db, 'products', item.productId)
                // Use increment to atomically increase stock
                batch.update(productRef, {
                    stock: increment(item.quantity)
                })
            }

            // Update the sale status to "Returned"
            const saleRef = doc(db, 'sales', sale.id)
            batch.update(saleRef, {
                status: 'Returned'
            })

            // Commit all operations atomically
            await batch.commit()

            alert('Retour effectué avec succès. Le stock a été restauré.')
        } catch (err) {
            console.error(err)
            alert('Erreur lors du retour')
        }
    }

    const formatDate = (timestamp: any) => {
        const date = timestamp.toDate()
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

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
                    <Navbar title="Gestion des Retours" />

                    {sales.length === 0 ? (
                        <div style={{
                            background: colors.white,
                            padding: '40px',
                            borderRadius: '16px',
                            textAlign: 'center',
                            color: colors.grayDark,
                            border: `1px solid ${colors.grayLight}`
                        }}>
                            Aucune vente disponible pour retour
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {sales.map(sale => (
                                <div
                                    key={sale.id}
                                    style={{
                                        background: colors.white,
                                        padding: '25px',
                                        borderRadius: '16px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        border: `1px solid ${colors.grayLight}`
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '20px',
                                        paddingBottom: '15px',
                                        borderBottom: `2px solid ${colors.grayLight}`
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: colors.navy, fontSize: '18px', marginBottom: '5px' }}>
                                                {sale.clientName}
                                            </div>
                                            <div style={{ fontSize: '14px', color: colors.grayDark }}>
                                                {formatDate(sale.date)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: '600', color: colors.navy, fontSize: '18px', marginBottom: '5px' }}>
                                                {sale.totalAmount.toFixed(2)} DH
                                            </div>
                                            <div style={{ fontSize: '14px', color: colors.success }}>
                                                Profit: {sale.totalProfit.toFixed(2)} DH
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: colors.navy, marginBottom: '10px' }}>
                                            Articles:
                                        </div>
                                        {sale.items.map((item, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    padding: '12px',
                                                    background: '#f7fafc',
                                                    borderRadius: '8px',
                                                    marginBottom: '8px',
                                                    fontSize: '14px',
                                                    color: colors.grayDark
                                                }}
                                            >
                                                {item.productName} - {item.quantity} × {item.unitPrice} DH = {item.subtotal} DH
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleReturn(sale)}
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: colors.white,
                                            background: colors.danger,
                                            border: 'none',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <ArrowLeftIcon />
                                        Effectuer le Retour
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MobileWrapper>
    )
}
