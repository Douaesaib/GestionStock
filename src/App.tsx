import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { db } from './firebase'
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc, query, where, Timestamp, writeBatch, increment } from 'firebase/firestore'
import { BleClient } from '@capacitor-community/bluetooth-le'
// @ts-ignore - esc-pos-encoder doesn't have type definitions
import EscPosEncoder from 'esc-pos-encoder'
import './App.css'

// Interfaces
interface Product {
  id: string;
  name: string;
  buyPrice: number;
  sellPriceGros: number;
  sellPriceDetail: number;
  stock: number;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  type: 'Gros' | 'Detail';
}

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  buyPrice: number;
  subtotal: number;
  profit: number;
}

interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  totalAmount: number;
  totalProfit: number;
  date: Timestamp;
  items: CartItem[];
  status: 'Completed' | 'Returned';
}

// SVG Icons (Simple, Clean)
const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const BoxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ShoppingCartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const MinusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const PrinterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)

const FileTextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

// Shared Print Receipt Function
const printReceipt = async (saleData: {
  clientName: string;
  items: CartItem[];
  totalAmount: number;
  date: Date;
}) => {
  try {
    // Initialize Bluetooth
    await BleClient.initialize()

    // Check if Bluetooth is available
    const isEnabled = await BleClient.isEnabled()
    if (!isEnabled) {
      console.log('Bluetooth is not enabled')
      return
    }

    // For simplicity, we'll try to connect to a known device
    // In production, you'd want a device picker or saved device ID
    const deviceId = 'YOUR_PRINTER_DEVICE_ID'

    if (!deviceId || deviceId === 'YOUR_PRINTER_DEVICE_ID') {
      console.log('No printer device configured. Sale saved but receipt not printed.')
      return
    }

    // Connect to device
    await BleClient.connect(deviceId)

    // Get service and characteristic (these are typical ESC/POS values)
    const serviceId = '0000ff00-0000-1000-8000-00805f9b34fb'
    const characteristicId = '0000ff02-0000-1000-8000-00805f9b34fb'

    // Create receipt using EscPosEncoder
    const encoder = new EscPosEncoder()
    const receipt = encoder
      .initialize()
      .align('center')
      .bold(true)
      .text('SOCIETE X')
      .bold(false)
      .newline()
      .align('left')
      .text(saleData.date.toLocaleString('fr-FR'))
      .newline()
      .text('----------------')
      .newline()

    // Add items
    saleData.items.forEach(item => {
      receipt
        .text(item.productName)
        .text(' ... ')
        .text(`${item.quantity} x ${item.unitPrice.toFixed(2)}`)
        .newline()
    })

    receipt
      .text('----------------')
      .newline()
      .align('right')
      .text(`TOTAL: ${saleData.totalAmount.toFixed(2)} DH`)
      .newline()
      .align('center')
      .text('Merci de votre visite!')
      .newline()
      .newline()
      .cut()

    // Get encoded data
    const data = receipt.encode()

    // Write to printer
    await BleClient.write(deviceId, serviceId, characteristicId, data)

    // Disconnect
    await BleClient.disconnect(deviceId)

    console.log('Receipt printed successfully')
  } catch (error) {
    console.error('Print error:', error)
  }
}

// Color Palette
const colors = {
  navy: '#1e3a5f',
  navyLight: '#2c5282',
  white: '#ffffff',
  grayLight: '#e2e8f0',
  gray: '#cbd5e0',
  grayDark: '#718096',
  success: '#48bb78',
  danger: '#f56565',
  warning: '#ed8936',
  info: '#4299e1'
}

// Mobile Wrapper Component - Simplified to rely on index.css for centering
function MobileWrapper({ children, background = '#f7fafc' }: { children: React.ReactNode; background?: string }) {
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

// Login Page Component
function LoginPage() {
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

// Dashboard Component
function Dashboard() {
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

// Stock Page Component
function StockPage() {
  const navigate = useNavigate()
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
              Gestion Stock
            </h1>
            <button
              onClick={() => navigate('/dashboard')}
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
          </div>

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

// Clients Page Component
function ClientsPage() {
  const navigate = useNavigate()
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
              Gestion Clients
            </h1>
            <button
              onClick={() => navigate('/dashboard')}
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
          </div>

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

// Sales Page Component (POS)
function SalesPage() {
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
              Point de Vente
            </h1>
            <button
              onClick={() => navigate('/dashboard')}
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
          </div>

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

// Returns Page Component
function ReturnsPage() {
  const navigate = useNavigate()
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

  const formatDate = (timestamp: Timestamp) => {
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
              Gestion des Retours
            </h1>
            <button
              onClick={() => navigate('/dashboard')}
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
          </div>

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

// Invoices Page Component
function InvoicesPage() {
  const navigate = useNavigate()
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
              Factures
            </h1>
            <button
              onClick={() => navigate('/dashboard')}
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
          </div>

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

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
