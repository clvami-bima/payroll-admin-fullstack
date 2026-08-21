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

export default function PayrollRun() {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  function fetchPeriods() {
    api.get('/payroll/periods').then((res) => setPeriods(res.data));
  }

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      setLoading(true);
      api
        .get(`/payroll/periods/${selectedPeriod.id}/runs`)
        .then((res) => setRuns(res.data))
        .finally(() => setLoading(false));
    }
  }, [selectedPeriod]);

  async function handleCreatePeriod(e) {
    e.preventDefault();
    setMessage('');
    const { data } = await api.post('/payroll/periods', { month: Number(month), year: Number(year) });
    fetchPeriods();
    setSelectedPeriod(data);
  }

  async function handleRunPayroll() {
    if (!selectedPeriod) return;
    if (!window.confirm(`Jalankan payroll untuk periode ${MONTHS[selectedPeriod.month - 1]} ${selectedPeriod.year}? Ini akan menghitung ulang gaji semua karyawan aktif.`)) return;

    setRunning(true);
    setMessage('');
    try {
      const { data } = await api.post(`/payroll/periods/${selectedPeriod.id}/run`);
      setMessage(data.message);
      const res = await api.get(`/payroll/periods/${selectedPeriod.id}/runs`);
      setRuns(res.data);
    } finally {
      setRunning(false);
    }
  }

  async function handleDownloadPayslip(runId, employeeName) {
    const res = await api.get(`/payroll/runs/${runId}/payslip`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `slip-gaji-${employeeName}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const columns = [
    { key: 'employee_code', header: 'Kode' },
    { key: 'employee_name', header: 'Nama Karyawan' },
    { key: 'department', header: 'Departemen' },
    { key: 'base_salary', header: 'Gaji Pokok', render: (r) => formatCurrency(r.base_salary) },
    { key: 'total_allowance', header: 'Tunjangan', render: (r) => formatCurrency(r.total_allowance) },
    { key: 'total_deduction', header: 'Potongan', render: (r) => formatCurrency(r.total_deduction) },
    { key: 'net_salary', header: 'Gaji Bersih', render: (r) => <span className="font-semibold text-navy-900">{formatCurrency(r.net_salary)}</span> },
    {
      key: 'actions',
      header: 'Slip Gaji',
      render: (r) => (
        <button onClick={() => handleDownloadPayslip(r.id, r.employee_name)} className="text-accent hover:underline text-sm font-medium">
          Unduh PDF
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout title="Proses Payroll">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-navy-900 mb-3">Buat / Pilih Periode</h2>
            <form onSubmit={handleCreatePeriod} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bulan</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tahun</label>
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
                Buat / Buka Periode
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-navy-900 mb-3">Daftar Periode</h2>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPeriod(p)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center ${
                    selectedPeriod?.id === p.id ? 'bg-accent text-white' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{MONTHS[p.month - 1]} {p.year}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selectedPeriod?.id === p.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                    {p.status === 'processed' ? 'Diproses' : 'Draft'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedPeriod ? (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    Periode: {MONTHS[selectedPeriod.month - 1]} {selectedPeriod.year}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Menjalankan payroll akan menghitung gaji semua karyawan berstatus aktif.
                  </p>
                </div>
                <button
                  onClick={handleRunPayroll}
                  disabled={running}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-60"
                >
                  {running ? 'Memproses...' : 'Jalankan Payroll'}
                </button>
              </div>

              {message && (
                <p className="text-sm text-success bg-green-50 border border-green-100 rounded-lg px-3 py-2">{message}</p>
              )}

              <DataTable columns={columns} rows={runs} loading={loading} emptyMessage="Payroll belum dijalankan untuk periode ini." />
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
              Pilih atau buat periode payroll di sebelah kiri untuk memulai.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
