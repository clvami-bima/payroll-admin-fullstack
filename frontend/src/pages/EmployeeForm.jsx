import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import api from '../api/axios';

const emptyForm = {
  employee_code: '', name: '', email: '', position: '', department: '',
  join_date: '', base_salary: '', bank_account: '', status: 'active',
};

function formatCurrency(v) {
  return 'Rp ' + Number(v || 0).toLocaleString('id-ID');
}

export default function EmployeeForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [components, setComponents] = useState([]);
  const [newComponent, setNewComponent] = useState({ type: 'allowance', name: '', amount: '', is_percentage: false });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      api.get(`/employees/${id}`).then((res) => {
        const { salary_components, ...emp } = res.data;
        setForm({ ...emp, join_date: emp.join_date?.slice(0, 10) });
        setComponents(salary_components);
      });
    }
  }, [id, isNew]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isNew) {
        const { data } = await api.post('/employees', form);
        navigate(`/employees/${data.id}`);
      } else {
        await api.put(`/employees/${id}`, form);
        navigate('/employees');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data karyawan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComponent(e) {
    e.preventDefault();
    if (!newComponent.name || newComponent.amount === '') return;
    const { data } = await api.post(`/salary-components/employee/${id}`, newComponent);
    setComponents((c) => [...c, data]);
    setNewComponent({ type: 'allowance', name: '', amount: '', is_percentage: false });
  }

  async function handleDeleteComponent(componentId) {
    await api.delete(`/salary-components/${componentId}`);
    setComponents((c) => c.filter((x) => x.id !== componentId));
  }

  return (
    <DashboardLayout title={isNew ? 'Tambah Karyawan' : 'Kelola Karyawan'}>
      <div className="max-w-3xl space-y-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kode Karyawan" name="employee_code" value={form.employee_code} onChange={handleChange} required disabled={!isNew} />
            <Field label="Nama Lengkap" name="name" value={form.name} onChange={handleChange} required />
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
            <Field label="Jabatan" name="position" value={form.position} onChange={handleChange} />
            <Field label="Departemen" name="department" value={form.department} onChange={handleChange} />
            <Field label="Tanggal Bergabung" name="join_date" type="date" value={form.join_date} onChange={handleChange} required />
            <Field label="Gaji Pokok (Rp)" name="base_salary" type="number" min="0" value={form.base_salary} onChange={handleChange} required />
            <Field label="No. Rekening" name="bank_account" value={form.bank_account} onChange={handleChange} />
          </div>

          {!isNew && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          )}

          {error && <p role="alert" className="text-sm text-danger bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-60">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={() => navigate('/employees')} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-medium">
              Batal
            </button>
          </div>
        </form>

        {!isNew && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-navy-900 mb-4">Komponen Gaji (Tunjangan & Potongan)</h2>

            <div className="space-y-2 mb-4">
              {components.length === 0 && <p className="text-sm text-slate-400">Belum ada komponen gaji.</p>}
              {components.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm">
                  <span>
                    <span className={`font-medium ${c.type === 'allowance' ? 'text-success' : 'text-danger'}`}>
                      {c.type === 'allowance' ? '+ ' : '- '}{c.name}
                    </span>
                    <span className="text-slate-400 ml-2">
                      {c.is_percentage ? `${c.amount}% dari gaji pokok` : formatCurrency(c.amount)}
                    </span>
                  </span>
                  <button onClick={() => handleDeleteComponent(c.id)} className="text-danger hover:underline text-xs">
                    Hapus
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComponent} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tipe</label>
                <select
                  value={newComponent.type}
                  onChange={(e) => setNewComponent((f) => ({ ...f, type: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="allowance">Tunjangan</option>
                  <option value="deduction">Potongan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nama Komponen</label>
                <input
                  value={newComponent.name}
                  onChange={(e) => setNewComponent((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Tunjangan Transport"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-52"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Jumlah</label>
                <input
                  type="number"
                  min="0"
                  value={newComponent.amount}
                  onChange={(e) => setNewComponent((f) => ({ ...f, amount: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-32"
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 pb-2.5">
                <input
                  type="checkbox"
                  checked={newComponent.is_percentage}
                  onChange={(e) => setNewComponent((f) => ({ ...f, is_percentage: e.target.checked }))}
                />
                % dari gaji pokok
              </label>
              <button type="submit" className="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
                Tambah
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function Field({ label, name, type = 'text', value, onChange, required, disabled, min }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        required={required}
        disabled={disabled}
        min={min}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none disabled:bg-slate-100"
      />
    </div>
  );
}
