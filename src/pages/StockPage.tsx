import React, { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { MobileWrapper } from '../components/ui/Wrapper'
import { colors } from '../components/ui/colors'
import { EditIcon, TrashIcon } from '../components/ui/Icon'
import { Navbar } from '../components/Navbar'
import type { Product } from '../types/models'

export function StockPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [name, setName] = useState('')
    const [buyPrice, setBuyPrice] = useState('')
    const [sellPriceGros, setSellPriceGros] = useState('')
    const [sellPriceDetail, setSellPriceDetail] = useState('')
    const [stock, setStock] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Product[]
            setProducts(data)
        })
        return () => unsubscribe()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !buyPrice || !sellPriceGros || !sellPriceDetail || !stock) {
            alert('Veuillez remplir tous les champs')
            return
        }

        try {
            if (editingId) {
                await updateDoc(doc(db, 'products', editingId), {
                    name,
                    buyPrice: Number(buyPrice),
                    sellPriceGros: Number(sellPriceGros),
                    sellPriceDetail: Number(sellPriceDetail),
                    stock: Number(stock)
                })
                alert('Produit modifié avec succès')
            } else {
                await addDoc(collection(db, 'products'), {
                    name,
                    buyPrice: Number(buyPrice),
                    sellPriceGros: Number(sellPriceGros),
                    sellPriceDetail: Number(sellPriceDetail),
                    stock: Number(stock)
                })
                alert('Produit ajouté avec succès')
            }
            setName('')
            setBuyPrice('')
            setSellPriceGros('')
            setSellPriceDetail('')
            setStock('')
            setEditingId(null)
        } catch (err) {
            console.error(err)
            alert('Erreur lors de l\'opération')
        }
    }

    const handleEdit = (product: Product) => {
        setName(product.name)
        setBuyPrice(product.buyPrice.toString())
        setSellPriceGros(product.sellPriceGros.toString())
        setSellPriceDetail(product.sellPriceDetail.toString())
        setStock(product.stock.toString())
        setEditingId(product.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${name}"?`)) {
            try {
                await deleteDoc(doc(db, 'products', id))
                alert('Produit supprimé avec succès')
            } catch (err) {
                console.error(err)
                alert('Erreur lors de la suppression')
            }
        }
    }

    const handleCancel = () => {
        setName('')
        setBuyPrice('')
        setSellPriceGros('')
        setSellPriceDetail('')
        setStock('')
        setEditingId(null)
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
                    <Navbar title="Gestion Stock" />

                    {/* Form */}
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
                            {editingId ? 'Modifier Produit' : 'Ajouter Produit'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Nom du produit"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    fontSize: '16px',
                                    borderRadius: '10px',
                                    border: `2px solid ${colors.grayLight}`,
                                    marginBottom: '15px',
                                    boxSizing: 'border-box',
                                    outline: 'none'
                                }}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px' }}>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Prix d'achat (DH)"
                                    value={buyPrice}
                                    onChange={(e) => setBuyPrice(e.target.value)}
                                    style={{
                                        padding: '14px',
                                        fontSize: '16px',
                                        borderRadius: '10px',
                                        border: `2px solid ${colors.grayLight}`,
                                        boxSizing: 'border-box',
                                        outline: 'none'
                                    }}
                                />
                                <input
                                    type="number"
                                    placeholder="Stock"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    style={{
                                        padding: '14px',
                                        fontSize: '16px',
                                        borderRadius: '10px',
                                        border: `2px solid ${colors.grayLight}`,
                                        boxSizing: 'border-box',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px' }}>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Prix Gros (DH)"
                                    value={sellPriceGros}
                                    onChange={(e) => setSellPriceGros(e.target.value)}
                                    style={{
                                        padding: '14px',
                                        fontSize: '16px',
                                        borderRadius: '10px',
                                        border: `2px solid ${colors.grayLight}`,
                                        boxSizing: 'border-box',
                                        outline: 'none'
                                    }}
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Prix Détail (DH)"
                                    value={sellPriceDetail}
                                    onChange={(e) => setSellPriceDetail(e.target.value)}
                                    style={{
                                        padding: '14px',
                                        fontSize: '16px',
                                        borderRadius: '10px',
                                        border: `2px solid ${colors.grayLight}`,
                                        boxSizing: 'border-box',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: colors.white,
                                        background: colors.success,
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {editingId ? 'Enregistrer' : 'Ajouter'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        style={{
                                            padding: '14px 20px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: colors.white,
                                            background: colors.grayDark,
                                            border: 'none',
                                            borderRadius: '10px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Annuler
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Products List */}
                    <h2 style={{
                        color: colors.navy,
                        fontSize: '22px',
                        fontWeight: '600',
                        marginBottom: '20px'
                    }}>
                        Liste des Produits ({products.length})
                    </h2>
                    {products.length === 0 ? (
                        <div style={{
                            background: colors.white,
                            padding: '40px',
                            borderRadius: '16px',
                            textAlign: 'center',
                            color: colors.grayDark,
                            border: `1px solid ${colors.grayLight}`
                        }}>
                            Aucun produit disponible
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {products.map(product => (
                                <div
                                    key={product.id}
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
                                        alignItems: 'center',
                                        marginBottom: '15px'
                                    }}>
                                        <h3 style={{
                                            margin: 0,
                                            color: colors.navy,
                                            fontSize: '20px',
                                            fontWeight: '600'
                                        }}>
                                            {product.name}
                                        </h3>
                                        <div style={{
                                            background: product.stock < 5 ? '#fee' : '#efe',
                                            color: product.stock < 5 ? colors.danger : colors.success,
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            fontWeight: '600',
                                            fontSize: '14px'
                                        }}>
                                            Stock: {product.stock}
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '10px',
                                        marginBottom: '15px',
                                        fontSize: '14px',
                                        color: colors.grayDark
                                    }}>
                                        <div>Achat: <strong>{product.buyPrice} DH</strong></div>
                                        <div>Gros: <strong>{product.sellPriceGros} DH</strong></div>
                                        <div>Détail: <strong>{product.sellPriceDetail} DH</strong></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleEdit(product)}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '12px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: colors.white,
                                                background: colors.info,
                                                border: 'none',
                                                borderRadius: '10px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <EditIcon />
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id, product.name)}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                padding: '12px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: colors.white,
                                                background: colors.danger,
                                                border: 'none',
                                                borderRadius: '10px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <TrashIcon />
                                            Supprimer
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
