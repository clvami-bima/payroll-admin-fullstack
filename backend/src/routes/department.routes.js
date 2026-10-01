const express = require('express');

const {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');

const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listDepartments);
router.get('/:id', getDepartment);
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', requireRole('admin'), deleteDepartment);

module.exports = router;