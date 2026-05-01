import { Router } from 'express'
import { artisanRouter } from './artisanRoutes.js'
import { marketplaceRouter } from './marketplaceRoutes.js'
import { adminRouter } from './adminRoutes.js'
import { orderRouter } from './orderRoutes.js'
import { storeRouter } from './storeRoutes.js'
import { chatRouter } from './chatRoutes.js'

export const apiRouter = Router()

apiRouter.use('/artisan', artisanRouter)
apiRouter.use('/marketplace', marketplaceRouter)
apiRouter.use('/admin', adminRouter)
apiRouter.use('/orders', orderRouter)
apiRouter.use('/stores', storeRouter)
apiRouter.use('/chats', chatRouter)
