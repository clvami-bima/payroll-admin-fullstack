import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import DataTable from '../components/DataTable';
import api from '../api/axios';

function formatCurrency(v) {
  return 'Rp ' + Number(v || 0).toLocaleString('id-ID');
}

export default function Employees() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });

  function fetchEmployees() {
    setLoading(true);
    api
      .get('/employees', { params: { search, department, status, page, limit: 10 } })
      .then((res) => {
        setRows(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Hapus data karyawan "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    await api.delete(`/employees/${id}`);
    fetchEmployees();
  }

  const columns = [
    { key: 'employee_code', header: 'Kode' },
    { key: 'name', header: 'Nama' },
    { key: 'department', header: 'Departemen' },
    { key: 'position', header: 'Jabatan' },
    { key: 'base_salary', header: 'Gaji Pokok', render: (r) => formatCurrency(r.base_salary) },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {r.status === 'active' ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (r) => (
        <div className="flex gap-3">
          <Link to={`/employees/${r.id}`} className="text-accent hover:underline text-sm font-medium">
            Kelola
          </Link>
          <button onClick={() => handleDelete(r.id, r.name)} className="text-danger hover:underline text-sm font-medium">
            Hapus
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Data Karyawan">
      <div className="flex items-center justify-between mb-4">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / kode / email..."
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-accent outline-none"
          />
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Departemen"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-40 focus:ring-2 focus:ring-accent outline-none"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
            Filter
          </button>
        </form>
        <Link to="/employees/new" className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600">
          + Tambah Karyawan
        </Link>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} emptyMessage="Belum ada data karyawan." />

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm ${
                p === page ? 'bg-accent text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
