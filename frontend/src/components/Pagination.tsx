type PaginationProps = {
    page: number;
    total: number;
    limit: number;
    onChange: (nextPage: number) => void;
};

export function Pagination({ page, total, limit, onChange }: PaginationProps) {
    const pages = Math.max(1, Math.ceil(total / limit));
    if (pages <= 1) {
        return null;
    }

    return (
        <div className="pagination">
            <button className="button button--ghost" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>
                Previous
            </button>
            <span className="pagination__meta">
                Page {page} of {pages}
            </span>
            <button className="button button--ghost" onClick={() => onChange(Math.min(pages, page + 1))} disabled={page >= pages}>
                Next
            </button>
        </div>
    );
}
