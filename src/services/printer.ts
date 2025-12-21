import { BleClient } from '@capacitor-community/bluetooth-le'
// @ts-ignore - esc-pos-encoder doesn't have type definitions
import EscPosEncoder from 'esc-pos-encoder'
import type { CartItem } from '../types/models'

export const printReceipt = async (saleData: {
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
