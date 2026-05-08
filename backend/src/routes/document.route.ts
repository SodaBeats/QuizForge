import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { UploadedFilesRepository } from '../repository/UploadedFilesRepository.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res, next) => {
  const { limit, offset } = req.query;
  try {
    //get all documents by user ID
    const documents = await UploadedFilesRepository.getDocInfoByOwner(
      req.user.id,
      Number(limit),
      Number(offset),
    );
    const totalDocuments = await UploadedFilesRepository.countDocumentsOwned(
      req.user.id,
    );
    return res.status(200).json({ documents: documents, totalDocuments });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', verifyToken, async (req, res, next) => {
  // express puts params under the name in the route; here it's "id" not "docId"
  const docIdNum = Number(req.params.id);
  if (!docIdNum) {
    return res.status(400).json({ error: 'documentId required' });
  }
  try {
    const row = await UploadedFilesRepository.getDocIdAndTextByDocIdOwnerId(
      docIdNum,
      req.user.id,
    );

    if (!row) {
      return res.status(404).json({ error: 'document not found' });
    }

    return res
      .status(200)
      .json({ success: true, id: row.id, content: row.extracted_text });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', verifyToken, async (req, res, next) => {
  const docIdNum = Number(req.params.id);
  if (!docIdNum) {
    return res
      .status(400)
      .json({ success: false, message: 'Document ID required' });
  }
  try {
    const deletedFile = await UploadedFilesRepository.deleteDocByDocIdOwnerId(
      docIdNum,
      req.user.id,
    );

    if (!deletedFile) {
      return res
        .status(404)
        .json({ success: false, message: 'Document not found' });
    } else {
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    return next(error);
  }
});

export default router;
