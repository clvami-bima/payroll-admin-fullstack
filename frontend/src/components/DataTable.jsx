// Tabel data generik dengan dukungan kolom kustom, empty state, dan loading state.
// Dipakai ulang di halaman Karyawan, Laporan, dan Riwayat Payroll (data-heavy UI).
export default function DataTable({ columns, rows, loading, emptyMessage = 'Tidak ada data.' }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
        Memuat data...
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 font-semibold text-slate-600 uppercase text-xs tracking-wide"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id ?? i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
