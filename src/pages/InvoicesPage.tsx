import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where, Timestamp, doc, writeBatch, increment } from 'firebase/firestore'
import { db } from '../services/firebase'
import { MobileWrapper } from '../components/ui/Wrapper'
import { colors } from '../components/ui/colors'
import { PrinterIcon, FileTextIcon, TrashIcon } from '../components/ui/Icon'
import { Navbar } from '../components/Navbar'
import type { Sale } from '../types/models'
import { printReceipt } from '../services/printer'

// Receipt Modal Component for Browser Printing
function ReceiptModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
    return (
        <div className="receipt-modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div className="receipt-modal-content" style={{
                background: 'white',
                padding: '20px',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '350px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <div className="no-print" style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '10px'
                }}>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: colors.grayDark
                    }}>&times;</button>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>SOCIETE X</h2>
                    <p style={{ margin: '5px 0', color: colors.grayDark }}>
                        {sale.date.toDate().toLocaleString('fr-FR')}
                    </p>
                </div>

                <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '15px 0', marginBottom: '15px' }}>
                    {sale.items.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ flex: 1 }}>{item.productName}</span>
                            <span style={{ width: '40px', textAlign: 'center' }}>x{item.quantity}</span>
                            <span style={{ width: '80px', textAlign: 'right' }}>{item.subtotal.toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>
                    <span>TOTAL</span>
                    <span>{sale.totalAmount.toFixed(2)} DH</span>
                </div>

                <div style={{ textAlign: 'center', fontSize: '14px', color: colors.grayDark, marginBottom: '20px' }}>
                    Merci de votre visite!
                </div>

                <button
                    className="no-print"
                    onClick={() => window.print()}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: colors.navy,
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <PrinterIcon />
                    Imprimer (Navigateur)
                </button>
            </div>
        </div>
    )
}

export function InvoicesPage() {

    const [sales, setSales] = useState<Sale[]>([])
    const [filter, setFilter] = useState<'today' | 'all'>('today')
    const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null)

    useEffect(() => {
        let q = query(collection(db, 'sales'), where('status', '==', 'Completed'))

        if (filter === 'today') {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const todayTimestamp = Timestamp.fromDate(today)
            q = query(q, where('date', '>=', todayTimestamp))
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Sale[]
            // Sort by date descending
            data.sort((a, b) => b.date.toMillis() - a.date.toMillis())
            setSales(data)
        })

        return () => unsubscribe()
    }, [filter])

    const handleCancelSale = async (sale: Sale) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir annuler cette vente de ${sale.clientName}?`)) {
            return
        }

        try {
            const batch = writeBatch(db)

            // Restore stock
            for (const item of sale.items) {
                const productRef = doc(db, 'products', item.productId)
                batch.update(productRef, {
                    stock: increment(item.quantity)
                })
            }

            // Mark as Returned
            const saleRef = doc(db, 'sales', sale.id)
            batch.update(saleRef, {
                status: 'Returned'
            })

            await batch.commit()
            alert('Vente annulée et stock restauré.')
        } catch (err) {
            console.error(err)
            alert('Erreur lors de l\'annulation')
        }
    }

    const handleReprint = (sale: Sale) => {
        const saleDataForPrint = {
            clientName: sale.clientName,
            items: sale.items,
            totalAmount: sale.totalAmount,
            date: sale.date.toDate()
        }
        printReceipt(saleDataForPrint)
    }

    return (
        <MobileWrapper>
            {selectedSaleForPrint && (
                <ReceiptModal
                    sale={selectedSaleForPrint}
                    onClose={() => setSelectedSaleForPrint(null)}
                />
            )}
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
                    <Navbar title="Factures" />

                    {/* Filters */}
                    <div style={{
                        display: 'flex',
                        background: colors.white,
                        padding: '5px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        border: `1px solid ${colors.grayLight}`
                    }}>
                        <button
                            onClick={() => setFilter('today')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                background: filter === 'today' ? colors.navy : 'transparent',
                                color: filter === 'today' ? colors.white : colors.grayDark,
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Aujourd'hui
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                background: filter === 'all' ? colors.navy : 'transparent',
                                color: filter === 'all' ? colors.white : colors.grayDark,
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Tout l'historique
                        </button>
                    </div>

                    {/* Sales List */}
                    {sales.length === 0 ? (
                        <div style={{
                            background: colors.white,
                            padding: '40px',
                            borderRadius: '16px',
                            textAlign: 'center',
                            color: colors.grayDark,
                            border: `1px solid ${colors.grayLight}`
                        }}>
                            Aucune vente trouvée
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {sales.map(sale => (
                                <div
                                    key={sale.id}
                                    style={{
                                        background: colors.white,
                                        padding: '20px',
                                        borderRadius: '16px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        border: `1px solid ${colors.grayLight}`
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '15px'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: colors.navy, fontSize: '18px' }}>
                                                {sale.clientName}
                                            </div>
                                            <div style={{ fontSize: '14px', color: colors.grayDark, marginTop: '4px' }}>
                                                {sale.date.toDate().toLocaleString('fr-FR')}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: '600', color: colors.navy, fontSize: '18px' }}>
                                                {sale.totalAmount.toFixed(2)} DH
                                            </div>
                                            <div style={{ fontSize: '12px', color: colors.success }}>
                                                {sale.items.length} articles
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleReprint(sale)}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: colors.navy,
                                                background: '#e6f3ff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <FileTextIcon />
                                            BT Print
                                        </button>
                                        <button
                                            onClick={() => setSelectedSaleForPrint(sale)}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: colors.navy,
                                                background: '#e6f3ff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <PrinterIcon />
                                            Web Print
                                        </button>
                                        <button
                                            onClick={() => handleCancelSale(sale)}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: colors.danger,
                                                background: '#fff5f5',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <TrashIcon />
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MobileWrapper>
    )
}
