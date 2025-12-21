import React, { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { MobileWrapper } from '../components/ui/Wrapper'
import { colors } from '../components/ui/colors'
import { EditIcon, TrashIcon } from '../components/ui/Icon'
import { Navbar } from '../components/Navbar'
import type { Client } from '../types/models'

export function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [type, setType] = useState<'Gros' | 'Detail'>('Detail')
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'clients'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Client[]
            setClients(data)
        })
        return () => unsubscribe()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !phone || !address) {
            alert('Veuillez remplir tous les champs')
            return
        }

        try {
            if (editingId) {
                await updateDoc(doc(db, 'clients', editingId), {
                    name,
                    phone,
                    address,
                    type
                })
                alert('Client modifié avec succès')
            } else {
                await addDoc(collection(db, 'clients'), {
                    name,
                    phone,
                    address,
                    type
                })
                alert('Client ajouté avec succès')
            }
            setName('')
            setPhone('')
            setAddress('')
            setType('Detail')
            setEditingId(null)
        } catch (err) {
            console.error(err)
            alert('Erreur lors de l\'opération')
        }
    }

    const handleEdit = (client: Client) => {
        setName(client.name)
        setPhone(client.phone)
        setAddress(client.address)
        setType(client.type)
        setEditingId(client.id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${name}"?`)) {
            try {
                await deleteDoc(doc(db, 'clients', id))
                alert('Client supprimé avec succès')
            } catch (err) {
                console.error(err)
                alert('Erreur lors de la suppression')
            }
        }
    }

    const handleCancel = () => {
        setName('')
        setPhone('')
        setAddress('')
        setType('Detail')
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
                    <Navbar title="Gestion Clients" />

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
                            {editingId ? 'Modifier Client' : 'Ajouter Client'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Nom du client"
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
                            <input
                                type="text"
                                placeholder="Téléphone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
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
                            <input
                                type="text"
                                placeholder="Adresse"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
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
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as 'Gros' | 'Detail')}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    fontSize: '16px',
                                    borderRadius: '10px',
                                    border: `2px solid ${colors.grayLight}`,
                                    marginBottom: '15px',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    background: colors.white,
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="Detail">Détail</option>
                                <option value="Gros">Gros</option>
                            </select>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: colors.white,
                                        background: colors.info,
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

                    {/* Clients List */}
                    <h2 style={{
                        color: colors.navy,
                        fontSize: '22px',
                        fontWeight: '600',
                        marginBottom: '20px'
                    }}>
                        Liste des Clients ({clients.length})
                    </h2>
                    {clients.length === 0 ? (
                        <div style={{
                            background: colors.white,
                            padding: '40px',
                            borderRadius: '16px',
                            textAlign: 'center',
                            color: colors.grayDark,
                            border: `1px solid ${colors.grayLight}`
                        }}>
                            Aucun client disponible
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {clients.map(client => (
                                <div
                                    key={client.id}
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
                                            {client.name}
                                        </h3>
                                        <div style={{
                                            background: client.type === 'Gros' ? '#e6f3ff' : '#fff4e6',
                                            color: client.type === 'Gros' ? colors.info : colors.warning,
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            fontWeight: '600',
                                            fontSize: '14px'
                                        }}>
                                            {client.type}
                                        </div>
                                    </div>
                                    <div style={{
                                        color: colors.grayDark,
                                        fontSize: '16px',
                                        marginBottom: '10px'
                                    }}>
                                        Téléphone: <strong>{client.phone}</strong>
                                    </div>
                                    <div style={{
                                        color: colors.grayDark,
                                        fontSize: '16px',
                                        marginBottom: '15px'
                                    }}>
                                        Adresse: <strong>{client.address}</strong>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleEdit(client)}
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
                                            onClick={() => handleDelete(client.id, client.name)}
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
