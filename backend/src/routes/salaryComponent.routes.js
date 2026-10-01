const express = require('express');

const {
  listSalaryComponents,
  getSalaryComponent,
  createSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent
} = require('../controllers/salaryComponentController');

const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listSalaryComponents);
router.get('/:id', getSalaryComponent);

router.post(
  '/',
  requireRole('admin'),
  createSalaryComponent
);

router.put(
  '/:id',
  requireRole('admin'),
  updateSalaryComponent
);

router.delete(
  '/:id',
  requireRole('admin'),
  deleteSalaryComponent
);

module.exports = router;
