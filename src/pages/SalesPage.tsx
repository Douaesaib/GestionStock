import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, doc, writeBatch, increment, Timestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { MobileWrapper } from '../components/ui/Wrapper'
import { colors } from '../components/ui/colors'
import { MinusIcon, PlusIcon, TrashIcon, CheckIcon } from '../components/ui/Icon'
import { Navbar } from '../components/Navbar'
import type { Client, Product, CartItem } from '../types/models'
import { printReceipt } from '../services/printer'

export function SalesPage() {
    const navigate = useNavigate()
    const [clients, setClients] = useState<Client[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [cart, setCart] = useState<CartItem[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const unsubscribeClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Client[]
            setClients(data)
        })

        const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Product[]
            setProducts(data)
        })

        return () => {
            unsubscribeClients()
            unsubscribeProducts()
        }
    }, [])

    const addToCart = (product: Product) => {
        if (!selectedClient) {
            alert('Veuillez sélectionner un client d\'abord')
            return
        }

        const existingItem = cart.find(item => item.productId === product.id)
        const unitPrice = selectedClient.type === 'Gros' ? product.sellPriceGros : product.sellPriceDetail
        const buyPrice = product.buyPrice

        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                alert('Stock insuffisant')
                return
            }
            const newQuantity = existingItem.quantity + 1
            setCart(cart.map(item =>
                item.productId === product.id
                    ? {
                        ...item,
                        quantity: newQuantity,
                        subtotal: unitPrice * newQuantity,
                        profit: (unitPrice - buyPrice) * newQuantity
                    }
                    : item
            ))
        } else {
            if (product.stock < 1) {
                alert('Stock insuffisant')
                return
            }
            setCart([...cart, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitPrice,
                buyPrice,
                subtotal: unitPrice,
                profit: unitPrice - buyPrice
            }])
        }
    }

    const updateCartQuantity = (productId: string, change: number) => {
        const item = cart.find(i => i.productId === productId)
        if (!item) return

        const product = products.find(p => p.id === productId)
        if (!product) return

        const newQuantity = item.quantity + change
        if (newQuantity < 1) {
            setCart(cart.filter(i => i.productId !== productId))
            return
        }
        if (newQuantity > product.stock) {
            alert('Stock insuffisant')
            return
        }

        setCart(cart.map(i =>
            i.productId === productId
                ? {
                    ...i,
                    quantity: newQuantity,
                    subtotal: i.unitPrice * newQuantity,
                    profit: (i.unitPrice - i.buyPrice) * newQuantity
                }
                : i
        ))
    }

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.productId !== productId))
    }

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.subtotal, 0)
    }

    const calculateTotalProfit = () => {
        return cart.reduce((sum, item) => sum + item.profit, 0)
    }

    const handleConfirmSale = async () => {
        // Prevent double submission
        if (isSubmitting) {
            return
        }

        if (!selectedClient) {
            alert('Veuillez sélectionner un client')
            return
        }
        if (cart.length === 0) {
            alert('Le panier est vide')
            return
        }

        // Set loading state and disable button
        setIsSubmitting(true)

        try {
            // Create a batch for atomic operations
            const batch = writeBatch(db)

            // Calculate total profit: Sum of ((sellPrice - buyPrice) * qty) for each item
            const totalProfit = cart.reduce((sum, item) => {
                return sum + item.profit
            }, 0)

            const totalAmount = calculateTotal()

            // Create sale document reference
            const saleRef = doc(collection(db, 'sales'))
            const saleData = {
                clientId: selectedClient.id,
                clientName: selectedClient.name,
                totalAmount: totalAmount,
                totalProfit: totalProfit,
                date: Timestamp.now(),
                items: cart,
                status: 'Completed' as const
            }
            batch.set(saleRef, saleData)

            // Update stock for each product using increment
            for (const item of cart) {
                const productRef = doc(db, 'products', item.productId)
                // Use increment to atomically decrease stock
                batch.update(productRef, {
                    stock: increment(-item.quantity)
                })
            }

            // Commit all operations atomically
            await batch.commit()

            // Prepare sale data for printing
            const saleDataForPrint = {
                clientName: selectedClient.name,
                items: cart,
                totalAmount: totalAmount,
                date: new Date()
            }

            // Attempt to print receipt (non-blocking, graceful failure)
            printReceipt(saleDataForPrint).catch(err => {
                console.error('Print failed (sale still saved):', err)
            })

            // Show success alert
            alert('✅ Vente Enregistrée avec succès!')

            // Clear cart and reset client
            setCart([])
            setSelectedClient(null)

            // Navigate to dashboard after a short delay
            setTimeout(() => {
                navigate('/dashboard')
            }, 500)

        } catch (err) {
            console.error(err)
            alert('Erreur lors de la confirmation de la vente')
        } finally {
            // Always reset loading state
            setIsSubmitting(false)
        }
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
                    <Navbar title="Point de Vente" />

                    {/* Step 1: Select Client */}
                    <div style={{
                        background: colors.white,
                        padding: '25px',
                        borderRadius: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        marginBottom: '25px',
                        border: `1px solid ${colors.grayLight}`
                    }}>
                        <h2 style={{
                            marginTop: 0,
                            marginBottom: '20px',
                            color: colors.navy,
                            fontSize: '20px',
                            fontWeight: '600'
                        }}>
                            Étape 1: Sélectionner un Client
                        </h2>
                        <select
                            value={selectedClient?.id || ''}
                            onChange={(e) => {
                                const client = clients.find(c => c.id === e.target.value)
                                setSelectedClient(client || null)
                                setCart([]) // Clear cart when client changes
                            }}
                            style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '16px',
                                borderRadius: '10px',
                                border: `2px solid ${colors.grayLight}`,
                                boxSizing: 'border-box',
                                outline: 'none',
                                background: colors.white,
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">-- Sélectionner un client --</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.name} ({client.type})
                                </option>
                            ))}
                        </select>
                        {selectedClient && (
                            <div style={{
                                marginTop: '15px',
                                padding: '15px',
                                background: selectedClient.type === 'Gros' ? '#e6f3ff' : '#fff4e6',
                                borderRadius: '10px',
                                fontSize: '14px',
                                color: colors.navy
                            }}>
                                <strong>Client sélectionné:</strong> {selectedClient.name} - Type: {selectedClient.type}
                                {selectedClient.type === 'Gros' && ' (Prix Gros appliqués)'}
                                {selectedClient.type === 'Detail' && ' (Prix Détail appliqués)'}
                            </div>
                        )}
                    </div>

                    {/* Step 2: Add Products */}
                    {selectedClient && (
                        <div style={{
                            background: colors.white,
                            padding: '25px',
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            marginBottom: '25px',
                            border: `1px solid ${colors.grayLight}`
                        }}>
                            <h2 style={{
                                marginTop: 0,
                                marginBottom: '20px',
                                color: colors.navy,
                                fontSize: '20px',
                                fontWeight: '600'
                            }}>
                                Étape 2: Ajouter des Produits
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '15px'
                            }}>
                                {products.map(product => {
                                    const price = selectedClient.type === 'Gros' ? product.sellPriceGros : product.sellPriceDetail
                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            style={{
                                                padding: '15px',
                                                border: `2px solid ${colors.grayLight}`,
                                                borderRadius: '12px',
                                                cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                                                background: product.stock > 0 ? colors.white : '#f5f5f5',
                                                opacity: product.stock > 0 ? 1 : 0.6,
                                                transition: 'border-color 0.2s'
                                            }}
                                            onMouseOver={(e) => {
                                                if (product.stock > 0) {
                                                    e.currentTarget.style.borderColor = colors.warning
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.borderColor = colors.grayLight
                                            }}
                                        >
                                            <div style={{ fontWeight: '600', color: colors.navy, marginBottom: '8px' }}>
                                                {product.name}
                                            </div>
                                            <div style={{ fontSize: '14px', color: colors.grayDark, marginBottom: '4px' }}>
                                                Prix: {price} DH
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: product.stock < 5 ? colors.danger : colors.success,
                                                fontWeight: '600'
                                            }}>
                                                Stock: {product.stock}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Cart */}
                    {cart.length > 0 && (
                        <div style={{
                            background: colors.white,
                            padding: '25px',
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            marginBottom: '25px',
                            border: `1px solid ${colors.grayLight}`
                        }}>
                            <h2 style={{
                                marginTop: 0,
                                marginBottom: '20px',
                                color: colors.navy,
                                fontSize: '20px',
                                fontWeight: '600'
                            }}>
                                Panier
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {cart.map(item => {
                                    const product = products.find(p => p.id === item.productId)
                                    return (
                                        <div
                                            key={item.productId}
                                            style={{
                                                padding: '15px',
                                                border: `1px solid ${colors.grayLight}`,
                                                borderRadius: '12px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', color: colors.navy, marginBottom: '5px' }}>
                                                    {item.productName}
                                                </div>
                                                <div style={{ fontSize: '14px', color: colors.grayDark }}>
                                                    {item.unitPrice} DH × {item.quantity} = {item.subtotal} DH
                                                </div>
                                                {product && (
                                                    <div style={{ fontSize: '12px', color: colors.grayDark }}>
                                                        Stock disponible: {product.stock}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <button
                                                    onClick={() => updateCartQuantity(item.productId, -1)}
                                                    style={{
                                                        padding: '8px',
                                                        background: colors.grayLight,
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <MinusIcon />
                                                </button>
                                                <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateCartQuantity(item.productId, 1)}
                                                    disabled={product ? item.quantity >= product.stock : false}
                                                    style={{
                                                        padding: '8px',
                                                        background: colors.grayLight,
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: product && item.quantity < product.stock ? 'pointer' : 'not-allowed',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        opacity: product && item.quantity < product.stock ? 1 : 0.5
                                                    }}
                                                >
                                                    <PlusIcon />
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.productId)}
                                                    style={{
                                                        padding: '8px',
                                                        background: colors.danger,
                                                        color: colors.white,
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        marginLeft: '10px'
                                                    }}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div style={{
                                marginTop: '20px',
                                paddingTop: '20px',
                                borderTop: `2px solid ${colors.grayLight}`
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '10px',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: colors.navy
                                }}>
                                    <span>Total:</span>
                                    <span>{calculateTotal().toFixed(2)} DH</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '16px',
                                    color: colors.success,
                                    fontWeight: '600'
                                }}>
                                    <span>Profit Total:</span>
                                    <span>{calculateTotalProfit().toFixed(2)} DH</span>
                                </div>
                            </div>
                            <button
                                onClick={handleConfirmSale}
                                disabled={isSubmitting}
                                style={{
                                    width: '100%',
                                    marginTop: '20px',
                                    padding: '16px',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: colors.white,
                                    background: isSubmitting ? colors.grayDark : colors.success,
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    opacity: isSubmitting ? 0.7 : 1
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTop: '2px solid white',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon />
                                        Confirmer la Vente
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </MobileWrapper>
    )
}
