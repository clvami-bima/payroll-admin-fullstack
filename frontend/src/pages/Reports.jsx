import { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import DataTable from '../components/DataTable';
import api from '../api/axios';

function formatCurrency(v) {
  return 'Rp ' + Number(v || 0).toLocaleString('id-ID');
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function Reports() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });

  function fetchReport() {
    setLoading(true);
    api
      .get('/reports/payroll', { params: { year, month, department, page, limit: 15 } })
      .then((res) => {
        setRows(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchReport();
  }

  function exportCsv() {
    const header = ['Kode', 'Nama', 'Departemen', 'Periode', 'Gaji Pokok', 'Tunjangan', 'Potongan', 'Gaji Bersih'];
    const lines = rows.map((r) => [
      r.employee_code, r.employee_name, r.department,
      `${MONTHS[r.month - 1]} ${r.year}`,
      r.base_salary, r.total_allowance, r.total_deduction, r.net_salary,
    ]);
    const csv = [header, ...lines].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'laporan-payroll.csv';
    link.click();
  }

  const columns = [
    { key: 'employee_code', header: 'Kode' },
    { key: 'employee_name', header: 'Nama' },
    { key: 'department', header: 'Departemen' },
    { key: 'period', header: 'Periode', render: (r) => `${MONTHS[r.month - 1]} ${r.year}` },
    { key: 'base_salary', header: 'Gaji Pokok', render: (r) => formatCurrency(r.base_salary) },
    { key: 'total_allowance', header: 'Tunjangan', render: (r) => formatCurrency(r.total_allowance) },
    { key: 'total_deduction', header: 'Potongan', render: (r) => formatCurrency(r.total_deduction) },
    { key: 'net_salary', header: 'Gaji Bersih', render: (r) => <span className="font-semibold">{formatCurrency(r.net_salary)}</span> },
  ];

  return (
    <DashboardLayout title="Laporan Payroll">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-2">
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">Semua Bulan</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Tahun"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-28"
          />
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Departemen"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-40"
          />
          <button type="submit" className="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
            Terapkan Filter
          </button>
        </form>
        <button onClick={exportCsv} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">
          Ekspor CSV
        </button>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} emptyMessage="Tidak ada data payroll untuk filter ini." />

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-accent text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
