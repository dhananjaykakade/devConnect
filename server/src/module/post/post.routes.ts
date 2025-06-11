import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware'
import { createPost ,getAllPosts,getPostById,updatePost,deletePost,toggleLikePost,addComment,deleteComment,getCommentsByPost} from './post.controller'

const router = Router()

router.post('/', authenticate, createPost)
router.put('/:id', authenticate, updatePost)
router.delete('/:id', authenticate, deletePost)
router.get('/all', getAllPosts)
router.get('/all/:id', getPostById)
router.patch('/:id/like', authenticate, toggleLikePost)
router.post('/:id/comments', authenticate, addComment)
router.delete('/comments/:id', authenticate, deleteComment)
router.get('/:id/comments', authenticate, getCommentsByPost)


export default router
