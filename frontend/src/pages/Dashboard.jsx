import { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatCard from '../components/StatCard';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function formatCurrency(v) {
  return 'Rp ' + Number(v || 0).toLocaleString('id-ID');
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/reports/summary')
      .then((res) => setSummary(res.data))
      .finally(() => setLoading(false));
  }, []);

  const chartData = summary?.employees_by_department?.map((d) => ({
    department: d.department || 'Lainnya',
    total: Number(d.total),
  })) || [];

  return (
    <DashboardLayout title="Dashboard">
      {loading ? (
        <p className="text-slate-400 text-sm">Memuat data dashboard...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Karyawan Aktif" value={summary.total_active_employees} />
            <StatCard
              label="Gaji Bersih (Periode Terakhir)"
              value={formatCurrency(summary.payroll_summary.total_net)}
              sublabel={
                summary.latest_period
                  ? `${summary.latest_period.month}/${summary.latest_period.year}`
                  : 'Belum ada payroll diproses'
              }
              accent="success"
            />
            <StatCard
              label="Total Tunjangan+Potongan"
              value={formatCurrency(
                Number(summary.payroll_summary.total_gross) - Number(summary.payroll_summary.total_net) + Number(summary.payroll_summary.total_deduction)
              )}
            />
            <StatCard
              label="Karyawan Diproses"
              value={summary.payroll_summary.employee_count}
              sublabel="pada periode payroll terakhir"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-navy-900 mb-4">Karyawan per Departemen</h2>
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada data karyawan.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
