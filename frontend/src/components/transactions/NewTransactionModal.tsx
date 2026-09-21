import React, { useState } from 'react';
import { X, DollarSign, Tag, Calendar, FileText } from 'lucide-react';
import { CreateTransactionDto } from '../../types/transaction';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTransactionDto) => Promise<void>;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [description, setDescription] = useState('Almuerzo en restaurante');
  const [amount, setAmount] = useState('50000');
  const [category, setCategory] = useState('Comida');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (!description.trim()) {
      setError('La descripción es requerida');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Introduce un monto válido mayor a 0');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        description: description.trim(),
        amount: numAmount,
        category,
        type,
        date,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar transacción');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card modal-content"
        style={{
          maxWidth: '480px',
          width: '100%',
          boxShadow: 'var(--shadow-xl)',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: 'var(--color-slate-900)' }}>
            Registrar Nuevo Movimiento
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div className="auth-error-alert" style={{ marginBottom: '1rem' }}>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Tipo de Movimiento</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`btn ${type === 'expense' ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  backgroundColor: type === 'expense' ? 'var(--color-danger-500)' : 'transparent',
                  borderColor: type === 'expense' ? 'var(--color-danger-500)' : 'var(--border-color)',
                  color: type === 'expense' ? '#fff' : 'var(--text-primary)',
                }}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`btn ${type === 'income' ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  backgroundColor: type === 'income' ? 'var(--color-success-600)' : 'transparent',
                  borderColor: type === 'income' ? 'var(--color-success-600)' : 'var(--border-color)',
                  color: type === 'income' ? '#fff' : 'var(--text-primary)',
                }}
              >
                Ingreso
              </button>
            </div>
          </div>

          <Input
            id="tx-description"
            label="Descripción"
            placeholder="ej. Almuerzo de trabajo / Supermercado"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            icon={<FileText size={18} />}
            required
          />

          <Input
            id="tx-amount"
            label="Monto ($)"
            type="number"
            step="0.01"
            placeholder="50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            icon={<DollarSign size={18} />}
            required
          />

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="tx-category" className="form-label">Categoría</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Tag size={18} />
              </div>
              <select
                id="tx-category"
                className="input-field has-icon"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', height: '42px' }}
              >
                <option value="Comida">Comida</option>
                <option value="Alimentación">Alimentación</option>
                <option value="Transporte">Transporte</option>
                <option value="Vivienda">Vivienda</option>
                <option value="Servicios">Servicios</option>
                <option value="Ocio">Ocio</option>
                <option value="Salud">Salud</option>
                <option value="Educación">Educación</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          <Input
            id="tx-date"
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            icon={<Calendar size={18} />}
            required
          />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              style={{ flex: 1 }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              id="tx-submit-btn"
              type="submit"
              variant="primary"
              style={{ flex: 1 }}
              isLoading={isSubmitting}
            >
              Guardar Gasto
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
