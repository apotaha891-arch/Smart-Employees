import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Table Component
 * Supports sorting, pagination, and row actions
 */
const Table = ({
    columns = [],
    data = [],
    keyExtractor = (item, idx) => idx,
    onRowClick = null,
    actions = [], // Array of { label, icon, onClick }
    sortable = true,
    paginated = false,
    pageSize = 10,
    striped = true,
    hover = true,
    className = '',
    style = {},
    ...props
}) => {
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc',
    });
    const [currentPage, setCurrentPage] = useState(0);

    // Handle sorting
    const handleSort = (columnKey) => {
        if (!sortable) return;

        let direction = 'asc';
        if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key: columnKey, direction });
    };

    // Sort data
    let sortedData = [...data];
    if (sortConfig.key) {
        sortedData.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Handle pagination
    let displayData = sortedData;
    let totalPages = 1;
    if (paginated) {
        totalPages = Math.ceil(sortedData.length / pageSize);
        const start = currentPage * pageSize;
        displayData = sortedData.slice(start, start + pageSize);
    }

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        ...style,
    };

    const headerCellStyle = {
        textAlign: 'left',
        padding: '1rem',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid var(--color-border-subtle)',
        color: 'var(--text-secondary)',
        fontSize: '0.8rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        cursor: sortable ? 'pointer' : 'default',
        userSelect: 'none',
    };

    const bodyCellStyle = {
        padding: '1rem',
        borderBottom: '1px solid var(--color-border-subtle)',
        color: 'var(--color-text-main)',
        fontSize: '0.9rem',
    };

    const rowStyle = (index) => ({
        background: striped && index % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
        transition: 'background-color 0.2s ease',
        cursor: onRowClick ? 'pointer' : 'default',
        '&:hover': hover ? { background: 'rgba(139, 92, 246, 0.1)' } : {},
    });

    // Manual hover effect since inline styles don't support pseudo-selectors
    const [hoveredRow, setHoveredRow] = useState(null);

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle} className={className} {...props}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                onClick={() => handleSort(column.key)}
                                style={{
                                    ...headerCellStyle,
                                    textAlign: column.align || 'left',
                                    width: column.width || 'auto',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {column.label}
                                    {sortable && sortConfig.key === column.key && (
                                        sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                    )}
                                </div>
                            </th>
                        ))}
                        {actions.length > 0 && <th style={headerCellStyle}>إجراءات</th>}
                    </tr>
                </thead>
                <tbody>
                    {displayData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                                style={{
                                    textAlign: 'center',
                                    padding: '3rem 1rem',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                لا توجد بيانات
                            </td>
                        </tr>
                    ) : (
                        displayData.map((row, idx) => {
                            const rowKey = keyExtractor(row, idx);
                            const isHovered = hoveredRow === rowKey;
                            const currentRowStyle = {
                                ...rowStyle(idx),
                                background: isHovered && hover 
                                    ? 'rgba(139, 92, 246, 0.1)' 
                                    : (striped && idx % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent'),
                            };

                            return (
                                <tr
                                    key={rowKey}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    onMouseEnter={() => setHoveredRow(rowKey)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    style={currentRowStyle}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={`${rowKey}-${column.key}`}
                                            style={{
                                                ...bodyCellStyle,
                                                textAlign: column.align || 'left',
                                            }}
                                        >
                                            {column.render
                                                ? column.render(row[column.key], row)
                                                : row[column.key]}
                                        </td>
                                    ))}
                                    {actions.length > 0 && (
                                        <td style={bodyCellStyle}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {actions.map((action, actionIdx) => (
                                                    <button
                                                        key={actionIdx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            action.onClick(row);
                                                        }}
                                                        style={{
                                                            background: 'transparent',
                                                            border: '1px solid var(--color-border-subtle)',
                                                            color: 'var(--accent)',
                                                            borderRadius: '6px',
                                                            padding: '0.4rem 0.8rem',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            transition: 'all 0.2s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem',
                                                        }}
                                                        title={action.label}
                                                    >
                                                        {action.icon && <span>{action.icon}</span>}
                                                        {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            {paginated && totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    marginTop: '1rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                }}>
                    <div>
                        صفحة {currentPage + 1} من {totalPages} ({sortedData.length} نتيجة)
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                            style={{
                                background: currentPage === 0 ? 'rgba(255,255,255,0.05)' : 'var(--accent)',
                                color: currentPage === 0 ? 'var(--text-secondary)' : 'black',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.5rem 1rem',
                                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                            disabled={currentPage === totalPages - 1}
                            style={{
                                background: currentPage === totalPages - 1 ? 'rgba(255,255,255,0.05)' : 'var(--accent)',
                                color: currentPage === totalPages - 1 ? 'var(--text-secondary)' : 'black',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.5rem 1rem',
                                cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Table;
