import { Router } from 'express'
import { artisanRouter } from './artisanRoutes.js'
import { marketplaceRouter } from './marketplaceRoutes.js'
import { adminRouter } from './adminRoutes.js'
import { orderRouter } from './orderRoutes.js'
import { storeRouter } from './storeRoutes.js'
import { chatRouter } from './chatRoutes.js'
import { paymentRouter } from './paymentRoutes.js'
import { userRouter } from './userRoutes.js'

export const apiRouter = Router()

apiRouter.use('/artisan', artisanRouter)
apiRouter.use('/marketplace', marketplaceRouter)
apiRouter.use('/admin', adminRouter)
apiRouter.use('/orders', orderRouter)
apiRouter.use('/stores', storeRouter)
apiRouter.use('/chats', chatRouter)
apiRouter.use('/payments', paymentRouter)
apiRouter.use('/users', userRouter)
