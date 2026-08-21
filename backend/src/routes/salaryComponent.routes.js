const express = require('express');
const {
  listByEmployee, createComponent, updateComponent, deleteComponent,
} = require('../controllers/salaryComponentController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/employee/:employeeId', listByEmployee);
router.post('/employee/:employeeId', createComponent);
router.put('/:id', updateComponent);
router.delete('/:id', deleteComponent);

module.exports = router;
