import { Router } from 'express'
import { authenticate } from '../../middlewares/auth.middleware'
import { searchUsers,followUser,unfollowUser,getFollowers,getFollowing,checkIfFollowing } from './user.controller'

const router = Router()
// Route to search users by username
router.get('/search', searchUsers)
router.post('/:userId/follow', authenticate, followUser)
router.post('/:userId/unfollow', authenticate, unfollowUser)
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.get('/:userId/is-following/:targetUserId', checkIfFollowing);




export default router
