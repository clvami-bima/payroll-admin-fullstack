import { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import api from '../api/axios';

const leaveTypeLabels = {
  annual: 'Cuti Tahunan',
  sick: 'Sakit',
  permission: 'Izin',
  maternity: 'Melahirkan',
  other: 'Lainnya',
};

const statusLabels = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID');
}

function statusClass(status) {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };

  return classes[status] || 'bg-slate-100 text-slate-500';
}

export default function Leave() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    employee_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [leaveRes, employeeRes] = await Promise.all([
        api.get('/leave'),
        api.get('/employees', { params: { status: 'active', limit: 100 } }),
      ]);

      setRequests(leaveRes.data);
      setEmployees(employeeRes.data.data || []);

      if (employeeRes.data.data?.length) {
        const firstEmployee = employeeRes.data.data[0];

        if (!form.employee_id) {
          setForm((current) => ({
            ...current,
            employee_id: String(firstEmployee.id),
          }));
        }

        const balanceRes = await api.get(
          `/leave/${firstEmployee.id}/balance`
        );

        setBalance(balanceRes.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal mengambil data cuti.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadBalance(employeeId) {
    if (!employeeId) {
      setBalance(null);
      return;
    }

    try {
      const { data } = await api.get(
        `/leave/${employeeId}/balance`
      );

      setBalance(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal mengambil sisa cuti.'
      );
    }
  }

  function handleEmployeeChange(e) {
    const employeeId = e.target.value;

    setForm((current) => ({
      ...current,
      employee_id: employeeId,
    }));

    loadBalance(employeeId);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/leave', {
        employee_id: Number(form.employee_id),
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason,
      });

      setForm({
        employee_id: form.employee_id,
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
      });

      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal membuat pengajuan cuti.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(id) {
    if (!window.confirm('Setujui pengajuan cuti ini?')) return;

    try {
      await api.put(`/leave/${id}/approve`);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal menyetujui pengajuan.'
      );
    }
  }

  async function handleReject(id) {
    const reason = window.prompt(
      'Alasan penolakan:',
      'Tidak disetujui oleh HR.'
    );

    if (reason === null) return;

    try {
      await api.put(`/leave/${id}/reject`, {
        rejection_reason: reason,
      });

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal menolak pengajuan.'
      );
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Batalkan pengajuan cuti ini?')) return;

    try {
      await api.put(`/leave/${id}/cancel`);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal membatalkan pengajuan.'
      );
    }
  }

  return (
    <DashboardLayout title="Manajemen Cuti">
      <div className="space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">
              Sisa Cuti Tahunan
            </p>
            <p className="text-3xl font-bold text-navy-900 mt-2">
              {balance?.annual_remaining ?? '-'}
              <span className="text-sm font-normal text-slate-400 ml-1">
                hari
              </span>
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">
              Kuota Tahunan
            </p>
            <p className="text-3xl font-bold text-navy-900 mt-2">
              {balance?.annual_quota ?? '-'}
              <span className="text-sm font-normal text-slate-400 ml-1">
                hari
              </span>
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">
              Total Pengajuan
            </p>
            <p className="text-3xl font-bold text-navy-900 mt-2">
              {requests.length}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">
              Pengajuan Cuti
            </h2>
            <p className="text-sm text-slate-500">
              Kelola pengajuan, approval, dan pembatalan cuti.
            </p>
          </div>

          <button
            onClick={() => setShowForm((value) => !value)}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            {showForm ? 'Tutup Form' : '+ Ajukan Cuti'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <h3 className="font-semibold text-navy-900 mb-4">
              Pengajuan Cuti Baru
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Karyawan">
                <select
                  value={form.employee_id}
                  onChange={handleEmployeeChange}
                  required
                  className="input"
                >
                  <option value="">Pilih karyawan</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employee_code})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Jenis Cuti">
                <select
                  value={form.leave_type}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      leave_type: e.target.value,
                    }))
                  }
                  className="input"
                >
                  {Object.entries(leaveTypeLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Tanggal Mulai">
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      start_date: e.target.value,
                    }))
                  }
                  required
                  className="input"
                />
              </Field>

              <Field label="Tanggal Selesai">
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      end_date: e.target.value,
                    }))
                  }
                  required
                  className="input"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Alasan">
                  <textarea
                    value={form.reason}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        reason: e.target.value,
                      }))
                    }
                    rows="3"
                    placeholder="Masukkan alasan cuti..."
                    className="input"
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {saving ? 'Mengirim...' : 'Ajukan Cuti'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              Memuat data cuti...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Belum ada pengajuan cuti.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">
                      Karyawan
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">
                      Jenis
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">
                      Periode
                    </th>
                    <th className="text-center px-5 py-3 font-semibold text-slate-600">
                      Hari
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="text-right px-5 py-3 font-semibold text-slate-600">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {request.employee_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {request.employee_code}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {leaveTypeLabels[request.leave_type] ||
                          request.leave_type}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(request.start_date)}
                        {' - '}
                        {formatDate(request.end_date)}
                      </td>

                      <td className="px-5 py-4 text-center text-slate-600">
                        {request.total_days}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(
                            request.status
                          )}`}
                        >
                          {statusLabels[request.status] ||
                            request.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-3">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() =>
                                  handleApprove(request.id)
                                }
                                className="text-green-600 hover:underline text-xs font-medium"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() =>
                                  handleReject(request.id)
                                }
                                className="text-red-600 hover:underline text-xs font-medium"
                              >
                                Reject
                              </button>

                              <button
                                onClick={() =>
                                  handleCancel(request.id)
                                }
                                className="text-slate-500 hover:underline text-xs font-medium"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
