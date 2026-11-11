import { createApp } from './app.js'

const app = createApp()
const PORT = 3000

let server: any

async function startServer() {
    try {
        server = app.listen(PORT, () => {
            console.log(`
Сервер запущен по адресу: http://localhost:${PORT}
API: http://localhost:${PORT}/api
Swagger: http://localhost:${PORT}/api-docs
Проверить состояние сервера: http://localhost:${PORT}/health
            `)
        })
    } catch (error) {
        console.error('Ошибка сервера:', error)
        process.exit(1)
    }
}

async function shutdown() {
    console.log('Получен сигнал на завершение работы сервера.')
    server?.closeAllConnections()
    server?.close(() => {
        console.log('Сервер закрыт!')
        process.exit(0)
    })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

startServer()
