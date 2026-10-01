const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const hrRoutes = require('./routes/hr.routes');
const salaryComponentRoutes = require('./routes/salaryComponent.routes');
const payrollRoutes = require('./routes/payroll.routes');
const reportRoutes = require('./routes/report.routes');
const departmentRoutes = require('./routes/department.routes');
const errorHandler = require('./middleware/errorHandler');
const positionRoutes = require('./routes/position.routes');
const contractRoutes = require('./routes/contract.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const leaveRoutes = require('./routes/leave.routes');

const app = express();

// CORS dibatasi ke origin frontend yang dikonfigurasi -- bukan wildcard,
// karena aplikasi ini menangani data gaji yang sensitif.
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/salary-components', salaryComponentRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan.' }));
app.use(errorHandler);

module.exports = app;
