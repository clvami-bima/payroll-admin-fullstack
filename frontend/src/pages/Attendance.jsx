import { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import DataTable from '../components/DataTable';
import api from '../api/axios';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'present', label: 'Hadir' },
  { value: 'late', label: 'Terlambat' },
  { value: 'absent', label: 'Tidak Hadir' },
  { value: 'leave', label: 'Cuti' },
  { value: 'sick', label: 'Sakit' },
];

function formatTime(value) {
  if (!value) return '-';

  return new Date(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value) {
  if (!value) return '-';

  const datePart = String(value).slice(0, 10);
  const parts = datePart.split('-');

  if (parts.length !== 3) return '-';

  const [year, month, day] = parts;

  if (!year || !month || !day) return '-';

  return `${day}/${month}/${year}`;
}

function statusLabel(status) {
  const item = STATUS_OPTIONS.find((x) => x.value === status);
  return item?.label || status;
}

function statusClass(status) {
  const classes = {
    present: 'bg-green-100 text-green-700',
    late: 'bg-yellow-100 text-yellow-700',
    absent: 'bg-red-100 text-red-700',
    leave: 'bg-blue-100 text-blue-700',
    sick: 'bg-purple-100 text-purple-700',
  };

  return classes[status] || 'bg-slate-100 text-slate-600';
}

export default function Attendance() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [summary, setSummary] = useState({
    present_days: 0,
    late_days: 0,
    absent_days: 0,
    leave_days: 0,
    sick_days: 0,
    total_late_minutes: 0,
    total_overtime_minutes: 0,
  });

  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    employee_id: '',
    attendance_date: new Date().toISOString().slice(0, 10),
    check_in: '',
    check_out: '',
    status: 'present',
    notes: '',
  });

  async function fetchEmployees() {
    try {
      const { data } = await api.get('/employees', {
        params: {
          status: 'active',
          limit: 100,
        },
      });

      setEmployees(data.data || data || []);
    } catch (err) {
      console.error('Gagal mengambil karyawan:', err);
    }
  }

  async function fetchAttendance() {
    setLoading(true);

    try {
      const { data } = await api.get('/attendance', {
        params: {
          employee_id: employeeId || undefined,
          status: status || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });

      setRows(data || []);
    } catch (err) {
      console.error('Gagal mengambil absensi:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSummary() {
    try {
      const { data } = await api.get('/attendance/summary', {
        params: {
          employee_id: employeeId || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });

      setSummary(data || {});
    } catch (err) {
      console.error('Gagal mengambil summary:', err);
    }
  }

  async function refresh() {
    await Promise.all([
      fetchAttendance(),
      fetchSummary(),
    ]);
  }

  useEffect(() => {
    fetchEmployees();
    refresh();
  }, []);

  function handleFilter(e) {
    e.preventDefault();
    refresh();
  }

  function openCreate() {
    setEditingId(null);

    setForm({
      employee_id: employees[0]?.id || '',
      attendance_date: new Date().toISOString().slice(0, 10),
      check_in: '',
      check_out: '',
      status: 'present',
      notes: '',
    });

    setShowForm(true);
  }

  function openEdit(row) {
    setEditingId(row.id);

    setForm({
      employee_id: row.employee_id,
      attendance_date: row.attendance_date,
      check_in: row.check_in
        ? new Date(row.check_in).toISOString().slice(0, 16)
        : '',
      check_out: row.check_out
        ? new Date(row.check_out).toISOString().slice(0, 16)
        : '',
      status: row.status,
      notes: row.notes || '',
    });

    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.employee_id || !form.attendance_date) {
      alert('Karyawan dan tanggal wajib diisi.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        employee_id: form.employee_id,
        attendance_date: form.attendance_date,
        check_in: form.check_in
          ? new Date(form.check_in).toISOString()
          : null,
        check_out: form.check_out
          ? new Date(form.check_out).toISOString()
          : null,
        status: form.status,
        notes: form.notes || null,
      };

      if (editingId) {
        await api.put(`/attendance/${editingId}`, {
          check_in: payload.check_in,
          check_out: payload.check_out,
          status: payload.status,
          notes: payload.notes,
        });
      } else {
        await api.post('/attendance', payload);
      }

      setShowForm(false);
      await refresh();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Gagal menyimpan data absensi.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckIn(row) {
    if (!window.confirm(`Check-in ${row.employee_name}?`)) return;

    try {
      await api.post('/attendance/check-in', {
        employee_id: row.employee_id,
        attendance_date: row.attendance_date,
      });

      await refresh();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Gagal melakukan check-in.'
      );
    }
  }

  async function handleCheckOut(row) {
    if (!window.confirm(`Check-out ${row.employee_name}?`)) return;

    try {
      await api.put(`/attendance/${row.id}/check-out`, {});
      await refresh();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Gagal melakukan check-out.'
      );
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Hapus data absensi ${row.employee_name}?`)) return;

    try {
      await api.delete(`/attendance/${row.id}`);
      await refresh();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Gagal menghapus data absensi.'
      );
    }
  }

  const columns = [
    {
      key: 'attendance_date',
      header: 'Tanggal',
      render: (r) => formatDate(r.attendance_date),
    },
    {
      key: 'employee',
      header: 'Karyawan',
      render: (r) => (
        <div>
          <p className="font-medium text-navy-900">
            {r.employee_name}
          </p>
          <p className="text-xs text-slate-400">
            {r.employee_code}
          </p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Departemen',
    },
    {
      key: 'check_in',
      header: 'Masuk',
      render: (r) => formatTime(r.check_in),
    },
    {
      key: 'check_out',
      header: 'Pulang',
      render: (r) => formatTime(r.check_out),
    },
    {
      key: 'late_minutes',
      header: 'Terlambat',
      render: (r) => `${r.late_minutes || 0} mnt`,
    },
    {
      key: 'overtime_minutes',
      header: 'Lembur',
      render: (r) => `${r.overtime_minutes || 0} mnt`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClass(r.status)}`}
        >
          {statusLabel(r.status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (r) => (
        <div className="flex items-center gap-2">
          {!r.check_in && (
            <button
              onClick={() => handleCheckIn(r)}
              className="text-green-600 hover:underline text-sm font-medium"
            >
              Check-in
            </button>
          )}

          {r.check_in && !r.check_out && (
            <button
              onClick={() => handleCheckOut(r)}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Check-out
            </button>
          )}

          <button
            onClick={() => openEdit(r)}
            className="text-slate-600 hover:underline text-sm"
          >
            Edit
          </button>

          <button
            onClick={() => handleDelete(r)}
            className="text-red-600 hover:underline text-sm"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Absensi Karyawan">
      <div className="space-y-5">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Hadir</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">
              {summary.present_days || 0}
            </p>
            <p className="text-xs text-slate-400">hari</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Terlambat</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {summary.late_days || 0}
            </p>
            <p className="text-xs text-slate-400">
              {summary.total_late_minutes || 0} menit
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Cuti / Sakit</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {(Number(summary.leave_days) || 0) +
                (Number(summary.sick_days) || 0)}
            </p>
            <p className="text-xs text-slate-400">
              {summary.leave_days || 0} cuti - {summary.sick_days || 0} sakit
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Lembur</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {summary.total_overtime_minutes || 0}
            </p>
            <p className="text-xs text-slate-400">menit</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-navy-900">
                Filter Absensi
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cari data berdasarkan karyawan, periode, dan status.
              </p>
            </div>

            <button
              onClick={openCreate}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium"
            >
              + Tambah Absensi
            </button>
          </div>

          <form
            onSubmit={handleFilter}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">Semua Karyawan</option>

              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.employee_code})
                </option>
              ))}
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium"
            >
              Terapkan
            </button>
          </form>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          emptyMessage="Belum ada data absensi."
        />

        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-semibold text-navy-900">
                  {editingId ? 'Edit Absensi' : 'Tambah Absensi'}
                </h2>

                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-700 text-xl"
                >
                  �
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Karyawan
                  </label>

                  <select
                    value={form.employee_id}
                    disabled={!!editingId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        employee_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                  >
                    <option value="">Pilih karyawan</option>

                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employee_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Tanggal
                  </label>

                  <input
                    type="date"
                    value={form.attendance_date}
                    disabled={!!editingId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        attendance_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Jam Masuk
                    </label>

                    <input
                      type="datetime-local"
                      value={form.check_in}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          check_in: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Jam Pulang
                    </label>

                    <input
                      type="datetime-local"
                      value={form.check_out}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          check_out: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    {STATUS_OPTIONS.filter((item) => item.value).map(
                      (item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Catatan
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Catatan tambahan..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-60"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
