'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { formatRelative } from '@/lib/utils';
import { useApp } from '@/components/layout/AppContext';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import {
  ListTodo, CheckCircle2, Clock, AlertTriangle, PlusCircle, X, Eye,
  Search, Trash2, Edit3, Bell, Calendar, Filter,
  ChevronLeft, Zap, Users, Target, ArrowUpLeft, Sparkles,
  AlertCircle, CircleDot, LayoutGrid, List, FileText,
} from 'lucide-react';

/* ─── Config ─── */
const priorityConfig: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  high: { bg: 'var(--color-danger-bg, #fee2e2)', color: 'var(--color-danger)', label: 'عالية', icon: <ArrowUpLeft size={12} /> },
  medium: { bg: 'var(--color-warning-bg, #fef3c7)', color: 'var(--color-warning)', label: 'متوسطة', icon: <CircleDot size={12} /> },
  low: { bg: 'var(--color-success-bg, #dcfce7)', color: 'var(--color-success)', label: 'منخفضة', icon: <Zap size={12} /> },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; headerBg: string }> = {
  pending: { label: 'قيد الانتظار', color: '#64748b', bg: 'var(--color-surface-alt)', headerBg: '#f1f5f9' },
  in_progress: { label: 'قيد التنفيذ', color: '#3b82f6', bg: 'var(--color-info-bg, #dbeafe)', headerBg: '#dbeafe' },
  completed: { label: 'مكتملة', color: '#22c55e', bg: 'var(--color-success-bg, #dcfce7)', headerBg: '#dcfce7' },
  overdue: { label: 'متأخرة', color: '#ef4444', bg: 'var(--color-danger-bg, #fee2e2)', headerBg: '#fee2e2' },
};

const COLUMNS: { status: TaskStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { status: 'overdue', label: 'متأخرة', color: '#ef4444', icon: <AlertTriangle size={16} /> },
  { status: 'pending', label: 'قيد الانتظار', color: '#64748b', icon: <Clock size={16} /> },
  { status: 'in_progress', label: 'قيد التنفيذ', color: '#3b82f6', icon: <CircleDot size={16} /> },
  { status: 'completed', label: 'مكتملة', color: '#22c55e', icon: <CheckCircle2 size={16} /> },
];

function getTimeRemaining(dueDate: string): { text: string; color: string; days: number; urgency: 'overdue' | 'urgent' | 'soon' | 'normal' } {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const days = Math.ceil(diffMs / 86400000);

  if (days < 0) return { text: `متأخر ${Math.abs(days)} يوم`, color: 'var(--color-danger)', days, urgency: 'overdue' };
  if (days === 0) return { text: 'اليوم', color: 'var(--color-warning)', days, urgency: 'urgent' };
  if (days === 1) return { text: 'غداً', color: 'var(--color-warning)', days, urgency: 'urgent' };
  if (days <= 3) return { text: `باقي ${days} أيام`, color: 'var(--color-warning)', days, urgency: 'soon' };
  return { text: `باقي ${days} يوم`, color: 'var(--color-success)', days, urgency: 'normal' };
}

/* ═══════════════════════════════════════════════════
   TASKS PAGE
   ═══════════════════════════════════════════════════ */
export default function TasksPage() {
  const { showToast, currentUser, hasPermission } = useApp();
  const [tasks, setTasks] = useState(store.getTasks());
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterPriority, setFilterPriority] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [kanbanColumns, setKanbanColumns] = useState(4);
  const [reminderShown, setReminderShown] = useState(false);
  const [form, setForm] = useState<{
    title: string; description: string; priority: TaskPriority; dueDate: string; assignedName: string;
  }>({ title: '', description: '', priority: 'medium', dueDate: '', assignedName: '' });

  useEffect(() => { store.updateTaskStatuses(); setTasks(store.getTasks()); }, []);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)');
    const tablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const desktop = window.matchMedia('(min-width: 1024px)');
    const update = () => {
      if (mobile.matches) setKanbanColumns(1);
      else if (tablet.matches) setKanbanColumns(2);
      else setKanbanColumns(4);
    };
    update();
    mobile.addEventListener('change', update);
    tablet.addEventListener('change', update);
    desktop.addEventListener('change', update);
    return () => { mobile.removeEventListener('change', update); tablet.removeEventListener('change', update); desktop.removeEventListener('change', update); };
  }, []);

  useEffect(() => {
    if (reminderShown) return;
    const overdue = tasks.filter(t => t.status === 'overdue');
    const today = tasks.filter(t => {
      const due = new Date(t.dueDate);
      return due.toDateString() === new Date().toDateString() && t.status !== 'completed';
    });
    if (overdue.length > 0 || today.length > 0) {
      setReminderShown(true);
      showToast(`لديك ${overdue.length} مهمة متأخرة و ${today.length} مهمة اليوم`, 'warning');
    }
  }, [tasks, reminderShown, showToast]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, search, filterPriority]);

  const handleComplete = (id: string) => { store.completeTask(id); setTasks(store.getTasks()); showToast('تم إكمال المهمة', 'success'); };
  const handleDelete = (id: string) => { store.deleteTask(id); setTasks(store.getTasks()); setDeleteConfirm(null); showToast('تم حذف المهمة', 'success'); };

  const handleAdd = () => {
    if (!form.title.trim()) return;
    store.addTask({
      id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        }), title: form.title, description: form.description,
      priority: form.priority, status: 'pending',
      dueDate: form.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(), assignedName: form.assignedName,
    });
    setTasks(store.getTasks()); setShowAdd(false);
    setForm({ title: '', description: '', priority: 'medium', dueDate: '', assignedName: '' });
    showToast('تمت إضافة المهمة', 'success');
  };

  const handleEdit = () => {
    if (!editTask) return;
    store.updateTask(editTask.id, { title: form.title, description: form.description, priority: form.priority, dueDate: form.dueDate, assignedName: form.assignedName });
    setTasks(store.getTasks()); setEditTask(null);
    setForm({ title: '', description: '', priority: 'medium', dueDate: '', assignedName: '' });
    showToast('تم تحديث المهمة', 'success');
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({ title: task.title, description: task.description, priority: task.priority, dueDate: task.dueDate.split('T')[0], assignedName: task.assignedName || '' });
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const overdue = tasks.filter(t => t.status === 'overdue').length;
    const today = tasks.filter(t => { const due = new Date(t.dueDate); return due.toDateString() === new Date().toDateString() && t.status !== 'completed'; }).length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    return { total, overdue, today, completed, inProgress, pending: total - completed - inProgress - overdue };
  }, [tasks]);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid var(--color-border)',
    borderRadius: 10, fontSize: 14, fontFamily: 'inherit', direction: 'rtl', outline: 'none',
    background: 'var(--color-surface-alt)', color: 'var(--color-text)',
    transition: 'border-color 0.15s',
  };

  /* ─── Stat Card Items ─── */
  const statItems = useMemo(() => [
    { label: 'الكل', count: stats.total, color: 'var(--color-primary)', bg: 'var(--color-surface-alt)', icon: <ListTodo size={18} /> },
    { label: 'متأخرة', count: stats.overdue, color: 'var(--color-danger)', bg: 'var(--color-danger-bg, #fee2e2)', icon: <AlertTriangle size={18} /> },
    { label: 'اليوم', count: stats.today, color: 'var(--color-warning)', bg: 'var(--color-warning-bg, #fef3c7)', icon: <Calendar size={18} /> },
    { label: 'قيد التنفيذ', count: stats.inProgress, color: 'var(--color-info)', bg: 'var(--color-info-bg, #dbeafe)', icon: <CircleDot size={18} /> },
    { label: 'قيد الانتظار', count: stats.pending, color: 'var(--color-text-secondary)', bg: 'var(--color-surface-alt)', icon: <Clock size={18} /> },
    { label: 'مكتملة', count: stats.completed, color: 'var(--color-success)', bg: 'var(--color-success-bg, #dcfce7)', icon: <CheckCircle2 size={18} /> },
  ], [stats]);

  /* ─── Task Card ─── */
  const renderTaskCard = (task: Task, showStatusBadge: boolean = true) => {
    const pri = priorityConfig[task.priority];
    const st = statusConfig[task.status];
    const isCompleted = task.status === 'completed';
    const isOverdue = task.status === 'overdue';
    const time = getTimeRemaining(task.dueDate);

    return (
      <div
        key={task.id}
        className="dash-activity-row"
        style={{
          background: 'var(--color-surface)', borderRadius: 14, padding: '16px 18px',
          border: `1px solid ${isOverdue ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRight: isOverdue ? '4px solid var(--color-danger)' : undefined,
          opacity: isCompleted ? 0.6 : 1,
          cursor: 'default',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Priority color strip */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 4, height: '100%',
          background: pri.color, opacity: isCompleted ? 0.3 : 0.7,
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {/* Checkbox */}
          <button onClick={() => handleComplete(task.id)} disabled={isCompleted} style={{
            width: 28, height: 28, borderRadius: '50%', border: isCompleted ? 'none' : '2px solid var(--color-border)',
            background: isCompleted ? 'var(--color-success)' : 'transparent', cursor: isCompleted ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            flexShrink: 0, marginTop: 2, transition: 'all 0.2s',
          }}>
            {isCompleted && <CheckCircle2 size={16} />}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title + badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 14, fontWeight: 600, textDecoration: isCompleted ? 'line-through' : 'none',
                color: isCompleted ? 'var(--color-text-muted)' : 'var(--color-text)',
              }}>
                {task.title}
              </span>
              <span className="badge" style={{ background: pri.bg, color: pri.color, fontSize: 10, padding: '2px 8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                {pri.icon} {pri.label}
              </span>
              {showStatusBadge && (
                <span className="badge" style={{ background: st.bg, color: st.color, fontSize: 10, padding: '2px 8px', fontWeight: 600 }}>
                  {st.label}
                </span>
              )}
            </div>

            {task.description && (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                {task.description}
              </p>
            )}

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                color: time.color, fontWeight: 600,
              }}>
                <Calendar size={12} />
                {time.text}
              </span>
              {task.assignedName && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  <Users size={12} />
                  {task.assignedName}
                </span>
              )}
              {task.relatedReportNumber && (
                <Link href={`/reports/${task.relatedReportId || ''}`} style={{
                  fontSize: 11, color: 'var(--color-info)', fontWeight: 500,
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3,
                  padding: '1px 6px', borderRadius: 4, background: 'var(--color-info-bg, #dbeafe)',
                }}>
                  <FileText size={9} />
                  {task.relatedReportNumber}
                </Link>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {task.relatedReportId && (
              <Link href={`/reports/${task.relatedReportId}`} style={{
                padding: 7, borderRadius: 8, color: 'var(--color-info)', background: 'var(--color-info-bg, #dbeafe)',
                display: 'flex', textDecoration: 'none', border: 'none', cursor: 'pointer',
              }}>
                <Eye size={15} />
              </Link>
            )}
            <button onClick={() => openEdit(task)} style={{
              padding: 7, borderRadius: 8, color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)',
              display: 'flex', border: 'none', cursor: 'pointer',
            }}>
              <Edit3 size={15} />
            </button>
            <button onClick={() => setDeleteConfirm(task.id)} style={{
              padding: 7, borderRadius: 8, color: 'var(--color-danger)', background: 'var(--color-danger-bg, #fee2e2)',
              display: 'flex', border: 'none', cursor: 'pointer',
            }}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ─── Modal ─── */
  const renderAddModal = (isEdit: boolean) => {
    const currentTask = isEdit ? editTask : null;
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 100,
      }}>
        <div style={{
          background: 'var(--color-surface)', borderRadius: 20, padding: 28, maxWidth: 520, width: '90%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'var(--color-info-bg, #dbeafe)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-info)',
              }}>
                {isEdit ? <Edit3 size={18} /> : <PlusCircle size={18} />}
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{isEdit ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</h3>
                {currentTask && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{currentTask.title}</p>}
              </div>
            </div>
            <button onClick={() => { setShowAdd(false); setEditTask(null); setForm({ title: '', description: '', priority: 'medium', dueDate: '', assignedName: '' }); }}
              style={{ background: 'var(--color-surface-alt)', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
              <X size={18} color="var(--color-text-muted)" />
            </button>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--color-text)' }}>عنوان المهمة *</label>
              <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="أدخل عنوان المهمة" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--color-text)' }}>الوصف</label>
              <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="وصف تفصيلي للمهمة..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--color-text)' }}>الأولوية</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button key={p} onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: 10,
                        border: `2px solid ${form.priority === p ? priorityConfig[p].color : 'var(--color-border)'}`,
                        background: form.priority === p ? priorityConfig[p].bg : 'var(--color-surface-alt)',
                        color: form.priority === p ? priorityConfig[p].color : 'var(--color-text-secondary)',
                        fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}>
                      {priorityConfig[p].icon} {priorityConfig[p].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--color-text)' }}>تاريخ الاستحقاق</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm(p => ({ ...p, dueDate: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--color-text)' }}>المُسند إليه</label>
              <input value={form.assignedName} onChange={(e) => setForm(p => ({ ...p, assignedName: e.target.value }))}
                placeholder="اسم الموظف المسند (اختياري)" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
            <button onClick={() => { setShowAdd(false); setEditTask(null); setForm({ title: '', description: '', priority: 'medium', dueDate: '', assignedName: '' }); }}
              className="btn btn-ghost">إلغاء</button>
            <button onClick={isEdit ? handleEdit : handleAdd} className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isEdit ? <><Edit3 size={16} /> حفظ التعديلات</> : <><PlusCircle size={16} /> إضافة المهمة</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ direction: 'rtl' }}>

      {/* ════════ OVERDUE ALERT BANNER ════════ */}
      {stats.overdue > 0 && (
        <div className="dash-stagger-in" style={{
          background: 'linear-gradient(135deg, var(--color-danger-bg, #fee2e2), var(--color-surface))',
          border: '1px solid var(--color-danger)', borderRadius: 16, padding: '16px 22px',
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div className="dash-pulse-glow" style={{
            width: 44, height: 44, borderRadius: 12, background: 'var(--color-danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-danger)' }}>
              لديك {stats.overdue} مهمة متأخرة تحتاج اهتمام فوري
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-danger)', opacity: 0.8 }}>
              {stats.overdue === 1
                ? `المهمة: ${tasks.find(t => t.status === 'overdue')?.title}`
                : `أكثر تأخراً منذ ${Math.max(...tasks.filter(t => t.status === 'overdue').map(t => Math.ceil((Date.now() - new Date(t.dueDate).getTime()) / 86400000)))} يوم`}
            </p>
          </div>
          <button onClick={() => setViewMode('kanban')} style={{
            padding: '8px 16px', borderRadius: 10, background: 'var(--color-danger)',
            color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <LayoutGrid size={14} />
            عرض الكل
          </button>
        </div>
      )}

      {/* ════════ HEADER ════════ */}
      <div className="dash-stagger-in" style={{
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
        borderRadius: 20, padding: '28px 28px 24px', marginBottom: 24,
        color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, left: -40, width: 180, height: 180,
          borderRadius: '50%', background: 'rgba(201, 169, 110, 0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, right: -30, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(201, 169, 110, 0.05)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ListTodo size={22} color="white" />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>المهام</h1>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {stats.today > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.2)' }}><Calendar size={12} />{stats.today} اليوم</span>}
              {stats.overdue > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.2)' }}><AlertTriangle size={12} />{stats.overdue} متأخرة</span>}
              <span>{stats.pending} قيد الانتظار</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>{stats.completed} مكتملة</span>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            <button onClick={() => setShowAdd(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 22px', borderRadius: 12,
              background: '#c9a96e', color: '#1e3a5f',
              fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(201, 169, 110, 0.3)',
            }}>
              <PlusCircle size={18} />
              إضافة مهمة
            </button>

            {/* Completion progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 120, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                <div style={{ width: `${completionRate}%`, height: '100%', borderRadius: 3, background: '#22c55e', transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{completionRate}% مكتمل</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ STAT CARDS ════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {statItems.map((s, i) => (
          <div key={i} className="card dash-stat-card dash-stagger-in" style={{
            padding: '16px 18px', borderRadius: 14,
            animationDelay: `${i * 60}ms`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.color,
              }}>
                {s.icon}
              </div>
              <div>
                <p className="dash-count-up" style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0, lineHeight: 1.1, animationDelay: `${i * 60 + 150}ms` }}>{s.count}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ════════ TOOLBAR ════════ */}
      <div className="card dash-stagger-in" style={{
        padding: '12px 16px', borderRadius: 14, marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        animationDelay: '350ms',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في المهام..."
            style={{
              width: '100%', padding: '9px 36px 9px 12px',
              border: '1.5px solid var(--color-border)', borderRadius: 10, fontSize: 13,
              fontFamily: 'inherit', direction: 'rtl', outline: 'none', background: 'var(--color-surface-alt)',
              color: 'var(--color-text)', transition: 'border-color 0.15s',
            }}
          />
        </div>

        {/* Priority Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} color="var(--color-text-muted)" />
          <button onClick={() => setFilterPriority('')}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              border: `1.5px solid ${!filterPriority ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: !filterPriority ? 'var(--color-info-bg, #dbeafe)' : 'var(--color-surface)',
              color: !filterPriority ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            الكل
          </button>
          {(['high', 'medium', 'low'] as const).map(p => (
            <button key={p} onClick={() => setFilterPriority(filterPriority === p ? '' : p)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                border: `1.5px solid ${filterPriority === p ? priorityConfig[p].color : 'var(--color-border)'}`,
                background: filterPriority === p ? priorityConfig[p].bg : 'var(--color-surface)',
                color: filterPriority === p ? priorityConfig[p].color : 'var(--color-text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
              }}>
              {priorityConfig[p].icon} {priorityConfig[p].label}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div style={{
          display: 'flex', background: 'var(--color-surface-alt)', borderRadius: 10, overflow: 'hidden',
          border: '1px solid var(--color-border)',
        }}>
          <button onClick={() => setViewMode('list')}
            style={{
              padding: '8px 14px', border: 'none',
              background: viewMode === 'list' ? 'var(--color-surface)' : 'transparent',
              color: viewMode === 'list' ? 'var(--color-text)' : 'var(--color-text-secondary)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
            <List size={14} /> قائمة
          </button>
          <button onClick={() => setViewMode('kanban')}
            style={{
              padding: '8px 14px', border: 'none',
              background: viewMode === 'kanban' ? 'var(--color-surface)' : 'transparent',
              color: viewMode === 'kanban' ? 'var(--color-text)' : 'var(--color-text-secondary)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
            <LayoutGrid size={14} /> أعمدة
          </button>
        </div>
      </div>

      {/* ════════ CONTENT ════════ */}
      {viewMode === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kanbanColumns}, 1fr)`, gap: 16 }}>
          {COLUMNS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.status);
            return (
              <div key={col.status} className="dash-stagger-in">
                {/* Column Header */}
                <div style={{
                  padding: '12px 16px', marginBottom: 12, borderRadius: 14,
                  background: statusConfig[col.status].headerBg,
                  borderTop: `3px solid ${col.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: col.color }}>
                    {col.icon}
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{col.label}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)',
                    background: 'var(--color-surface)', padding: '2px 10px', borderRadius: 10,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    {colTasks.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200 }}>
                  {colTasks.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)',
                      fontSize: 13, background: 'var(--color-surface)', borderRadius: 14,
                      border: '1px dashed var(--color-border)',
                    }}>
                      لا توجد مهام
                    </div>
                  ) : colTasks.map(task => renderTaskCard(task, false))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <ListTodo size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-muted)' }}>لا توجد مهام</p>
            </div>
          ) : filtered.map(task => renderTaskCard(task, true))}
        </div>
      )}

      {/* ════════ MODALS ════════ */}
      {showAdd && renderAddModal(false)}
      {editTask && renderAddModal(true)}

      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 20, padding: 32, maxWidth: 400, width: '90%',
            textAlign: 'center', border: '1px solid var(--color-border)',
            animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <div className="dash-pulse-glow" style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--color-danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Trash2 size={24} color="white" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: 'var(--color-text)' }}>حذف المهمة؟</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>
              {tasks.find(t => t.id === deleteConfirm)?.title}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost">إلغاء</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={16} /> حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}