import { Router } from 'express';
import documentController from './document.controller.js';
import { auth, validate, audit, upload, routeUpload } from '../../middleware/index.js';
import {
  createDocumentSchema,
  updateDocumentSchema,
  documentQuerySchema,
} from './document.validation.js';

const router = Router();

router.use(auth);

// Document CRUD
router.get(
  '/',
  validate(documentQuerySchema, 'query'),
  documentController.getAll.bind(documentController)
);

router.get('/:id', documentController.getById.bind(documentController));

router.post(
  '/',
  validate(createDocumentSchema),
  audit('documents'),
  documentController.create.bind(documentController)
);

// File upload as document
router.post(
  '/upload',
  upload.single('file'),
  routeUpload,
  audit('documents'),
  documentController.uploadFile.bind(documentController)
);

router.patch(
  '/:id',
  validate(updateDocumentSchema),
  audit('documents'),
  documentController.update.bind(documentController)
);

router.delete(
  '/:id',
  audit('documents'),
  documentController.delete.bind(documentController)
);

// Version management
router.get('/:id/versions', documentController.getVersionHistory.bind(documentController));

router.post(
  '/:id/versions/:versionNumber/restore',
  audit('documents'),
  documentController.restoreVersion.bind(documentController)
);

export default router;
