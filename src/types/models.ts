import { Timestamp } from 'firebase/firestore'

export interface Product {
    id: string;
    name: string;
    buyPrice: number;
    sellPriceGros: number;
    sellPriceDetail: number;
    stock: number;
}

export interface Client {
    id: string;
    name: string;
    phone: string;
    address: string;
    type: 'Gros' | 'Detail';
}

export interface CartItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    buyPrice: number;
    subtotal: number;
    profit: number;
}

export interface Sale {
    id: string;
    clientId: string;
    clientName: string;
    totalAmount: number;
    totalProfit: number;
    date: Timestamp;
    items: CartItem[];
    status: 'Completed' | 'Returned';
}
