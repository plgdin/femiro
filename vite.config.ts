import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleCreateOrder } from './api/create-order.ts'
import { handleVerifyPayment } from './api/verify-payment.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID
  process.env.RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET

  return {
    plugins: [
      react(),
      {
        name: 'api-server-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.method === 'POST' && req.url === '/api/create-order') {
              let bodyStr = ''
              req.on('data', (chunk: Buffer) => {
                bodyStr += chunk.toString()
              })
              req.on('end', async () => {
                try {
                  const body = bodyStr ? JSON.parse(bodyStr) : {}
                  const result = await handleCreateOrder(req, body)
                  res.statusCode = result.status
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(result.data))
                } catch (err: any) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: err.message || 'Server error' }))
                }
              })
              return
            }

            if (req.method === 'POST' && req.url === '/api/verify-payment') {
              let bodyStr = ''
              req.on('data', (chunk: Buffer) => {
                bodyStr += chunk.toString()
              })
              req.on('end', async () => {
                try {
                  const body = bodyStr ? JSON.parse(bodyStr) : {}
                  const result = await handleVerifyPayment(req, body)
                  res.statusCode = result.status
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(result.data))
                } catch (err: any) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: err.message || 'Server error' }))
                }
              })
              return
            }

            next()
          })
        }
      }
    ]
  }
})
