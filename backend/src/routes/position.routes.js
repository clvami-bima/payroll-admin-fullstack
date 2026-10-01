const express = require('express');

const {
  listPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition
} = require('../controllers/positionController');

const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listPositions);
router.get('/:id', getPosition);
router.post('/', createPosition);
router.put('/:id', updatePosition);
router.delete('/:id', requireRole('admin'), deletePosition);

module.exports = router;