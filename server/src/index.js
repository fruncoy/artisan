import './config.js'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { apiRouter } from './routes/index.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'amp-api' })
})

app.use('/api', apiRouter)

app.listen(PORT, () => {
  console.log(`AMP API running on port ${PORT}`)
})
