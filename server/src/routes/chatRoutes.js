import { Router } from 'express'
import { getMyMessages, sendMessage } from '../controllers/chatController.js'
import { verifyAuth } from '../middleware/auth.js'

export const chatRouter = Router()

chatRouter.get('/my', verifyAuth, getMyMessages)
chatRouter.post('/', verifyAuth, sendMessage)
