import { Router } from 'express';
import commentController from './comment.controller.js';
import { auth, validate, audit } from '../../middleware/index.js';
import {
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema,
  reactionSchema,
} from './comment.validation.js';

const router = Router();

router.use(auth);

// List comments for a commentable entity
router.get(
  '/',
  validate(commentQuerySchema, 'query'),
  commentController.getByCommentable.bind(commentController)
);

// Create comment
router.post(
  '/',
  validate(createCommentSchema),
  audit('comments'),
  commentController.create.bind(commentController)
);

// Update comment
router.patch(
  '/:id',
  validate(updateCommentSchema),
  audit('comments'),
  commentController.update.bind(commentController)
);

// Delete comment
router.delete(
  '/:id',
  audit('comments'),
  commentController.delete.bind(commentController)
);

// Toggle reaction on a comment
router.post(
  '/:id/reactions',
  validate(reactionSchema),
  commentController.addReaction.bind(commentController)
);

// Get replies for a comment
router.get(
  '/:id/replies',
  commentController.getReplies.bind(commentController)
);

export default router;
