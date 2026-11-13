import { Badge, Button, Table } from 'react-bootstrap';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../utils/format';

const TransactionTable = ({ items, onEdit, onDelete, showType = false, showDate = true }) => (
  <div className="table-responsive">
    <Table hover size="sm" className="mb-0">
      <thead className="table-light">
        <tr>
          {showDate && <th>Date</th>}
          {showType && <th>Type</th>}
          <th>Details</th>
          <th>Category</th>
          <th>Method</th>
          <th className="text-end">Amount</th>
          {(onEdit || onDelete) && <th className="text-end">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {items.map((t) => {
          const managed = t.source !== 'manual';
          const title = t.type === 'income' ? t.customerName || 'Walk-in / unnamed' : t.expenseName;
          return (
            <tr key={t._id}>
              {showDate && <td className="text-nowrap">{formatDate(t.dateKey)}</td>}
              {showType && <td><Badge bg={t.type === 'income' ? 'success' : 'danger'}>{t.type}</Badge></td>}
              <td>
                <div>{title}</div>
                <div className="small text-muted text-truncate-2">
                  {t.type === 'expense' && t.paidTo ? `Paid to ${t.paidTo}` : ''}
                  {t.description ? `${t.paidTo && t.type === 'expense' ? ' · ' : ''}${t.description}` : ''}
                </div>
              </td>
              <td>
                {t.category}
                {t.type === 'expense' && t.expenseType && (
                  <Badge bg={t.expenseType === 'shop' ? 'primary' : 'warning'} text={t.expenseType === 'shop' ? undefined : 'dark'} className="ms-1">
                    {t.expenseType}
                  </Badge>
                )}
              </td>
              <td>{t.paymentMethod}</td>
              <td className={`text-end ${t.type === 'income' ? 'amount-in' : 'amount-out'}`}>
                {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
              </td>
              {(onEdit || onDelete) && (
                <td className="text-end text-nowrap">
                  {managed ? (
                    <Badge bg="secondary" title="Managed from Credit Management">Credit</Badge>
                  ) : (
                    <>
                      {onEdit && <Button variant="link" size="sm" className="p-1" onClick={() => onEdit(t)} aria-label="Edit"><FiEdit2 /></Button>}
                      {onDelete && <Button variant="link" size="sm" className="p-1 text-danger" onClick={() => onDelete(t)} aria-label="Delete"><FiTrash2 /></Button>}
                    </>
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </Table>
  </div>
);

export default TransactionTable;
