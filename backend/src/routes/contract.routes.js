const express = require('express');

const {
  listContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract
} = require('../controllers/contractController');

const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listContracts);
router.get('/:id', getContract);
router.post('/', createContract);
router.put('/:id', updateContract);
router.delete('/:id', requireRole('admin'), deleteContract);

module.exports = router;