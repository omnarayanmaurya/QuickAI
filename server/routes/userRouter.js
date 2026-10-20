import express from 'express';

import {
    getUserCreations,
    getPublishedCreations,
    toggleLikeCreation,
    getUserProfile
} from '../controllers/userController.js';

import { auth } from '../middlewares/auth.js';

const userRouter = express.Router();

// Get logged-in user's creations
userRouter.get(
    '/get-user-creations',
    auth,
    getUserCreations
);

// Get all published creations
userRouter.get(
    '/get-published-creations',
    getPublishedCreations
);

// Like or unlike a creation
userRouter.post(
    '/toggle-like',
    auth,
    toggleLikeCreation
);

// Get logged-in user's profile
userRouter.get(
    '/get-user-profile',
    auth,
    getUserProfile
);

export default userRouter;