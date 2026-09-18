export function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="pagination-row">
      <div className="pagination-info">全{total}件</div>
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button className="btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
            ← 前へ
          </button>
          <span className="pagination-page">
            {page} / {totalPages}
          </span>
          <button className="btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
            次へ →
          </button>
        </div>
      )}
    </div>
  );
}
