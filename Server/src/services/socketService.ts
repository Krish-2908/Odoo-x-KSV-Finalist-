import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import logger from '../utils/logger.js'

export const initSocket = (server: HTTPServer) => {
    const io = new SocketIOServer(server, {
        cors: {
            origin: ['http://localhost:5173'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            credentials: true
        }
    })

    io.on('connection', (socket) => {
        logger.info(`Socket Connected: ${socket.id}`)

        // 1. Join a specific Trip room for live chat and tracking
        socket.on('join_trip', (data: { tripId: string }) => {
            if (data?.tripId) {
                socket.join(data.tripId)
                logger.info(`Socket ${socket.id} joined trip room: ${data.tripId}`)
            }
        })

        // 2. Location synchronization: Driver publishes active coordinate markers
        socket.on('update_location', (data: { tripId: string; lat: number; lng: number; eta: string }) => {
            if (data?.tripId) {
                // Broadcast coordinates and ETA to passengers inside this trip room
                socket.to(data.tripId).emit('location_changed', {
                    lat: data.lat,
                    lng: data.lng,
                    eta: data.eta
                })
            }
        })

        // 3. Live Chat messaging
        socket.on('send_message', (data: { tripId: string; senderId: string; senderName: string; text: string }) => {
            if (data?.tripId && data?.text) {
                // Broadcast message to everyone inside the trip room
                io.to(data.tripId).emit('receive_message', {
                    senderId: data.senderId,
                    senderName: data.senderName,
                    text: data.text,
                    createdAt: new Date().toISOString()
                })
                logger.info(`Message sent in trip room ${data.tripId}: ${data.text}`)
            }
        })

        socket.on('disconnect', () => {
            logger.info(`Socket Disconnected: ${socket.id}`)
        })
    })

    return io
}
