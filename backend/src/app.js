const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const salaryComponentRoutes = require('./routes/salaryComponent.routes');
const payrollRoutes = require('./routes/payroll.routes');
const reportRoutes = require('./routes/report.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS dibatasi ke origin frontend yang dikonfigurasi -- bukan wildcard,
// karena aplikasi ini menangani data gaji yang sensitif.
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/salary-components', salaryComponentRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan.' }));
app.use(errorHandler);

module.exports = app;
