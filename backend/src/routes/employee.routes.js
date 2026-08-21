const express = require('express');
const {
  listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee,
} = require('../controllers/employeeController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth); // semua endpoint karyawan wajib login

router.get('/', listEmployees);
router.get('/:id', getEmployee);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', requireRole('admin'), deleteEmployee); // hanya admin boleh hapus

module.exports = router;
