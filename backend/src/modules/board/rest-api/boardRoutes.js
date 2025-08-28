import { Router } from 'express';
import {
  getBoard,
  createBoardElement,
  updateBoardElements,
  removeBoardElement
} from './boardController.js';

const router = Router();


router.get('/:id', getBoard);

router.post('/:boardId/elements', createBoardElement);

router.put('/:boardId/elements', updateBoardElements);

router.delete('/:boardId/elements/:elementId', removeBoardElement);

export default router;
