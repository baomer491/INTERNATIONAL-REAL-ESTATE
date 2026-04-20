# خطة نظام إسناد المهام للموظفين

## الهدف
تحويل نظام المهام الحالي (البسيط) إلى نظام متكامل لإسناد المهام حيث يستطيع المسؤول (admin) إضافة مهام وتعيينها لموظفين محددين، مع إشعارات وعرض حسب الدور.

## تحليل الوضع الحالي

### ما هو موجود بالفعل:
1. **صفحة مهام** (`/tasks/page.tsx`) - 662 سطر - Kanban + List view مع فلترة وبحث
2. **Task interface** في `types/index.ts`: `id, title, description, priority, status, dueDate, createdAt, assignedName?, relatedReportId?, relatedReportNumber?`
3. **جدول tasks** في Supabase - أعمدة مطابقة
4. **store.ts** - عمليات CRUD كاملة (`addTask, updateTask, deleteTask, completeTask, updateTaskStatuses`)
5. **إسناد اسم فقط** (`assignedName` - نص حر) بدون ربط بـ employee ID
6. **لا توجد صلاحية** `tasks_manage` في PERMISSIONS
7. **كل المستخدمين** يرون كل المهام (لا تصفية بالدور)

### المشاكل الحالية:
1. `assignedName` نص حر - لا ربط فعلي بموظف
2. لا يوجد `assigned_to` (UUID) - لا يمكن الفلترة حسب الموظف
3. لا إشعارات عند إسناد مهمة
4. لا صلاحيات - أي مستخدم يضيف/يعدل/يحذف مهام
5. الموظف لا يرى مهامه فقط - يرى كل شيء

---

## الخطة المقترحة

### المرحلة 1: تحديث قاعدة البيانات (Supabase)

#### 1.1 إضافة أعمدة جديدة لجدول `tasks`:
```sql
ALTER TABLE tasks ADD COLUMN assigned_to uuid REFERENCES employees(id);
ALTER TABLE tasks ADD COLUMN created_by uuid REFERENCES employees(id);
ALTER TABLE tasks ADD COLUMN completed_at timestamp with time zone;
ALTER TABLE tasks ADD COLUMN recurrence text DEFAULT 'none'
  CHECK (recurrence = ANY (ARRAY['none','daily','weekly','monthly']));
ALTER TABLE tasks ADD COLUMN category text DEFAULT 'general';
```

**لماذا هذه الأعمدة؟**
- `assigned_to`: ربط فعلي بموظف (UUID) - للفلترة والإشعارات
- `created_by`: من أنشأ المهمة - للمساءلة
- `completed_at`: توقيت الإنجاز الفعلي - للتقارير
- `recurrence`: تكرار المهمة (موجود في types لكن ليس في DB)
- `category`: تصنيف (عام/تثمين/متابعة/إداري)

#### 1.2 إضافة فهارس:
```sql
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
```

### المرحلة 2: تحديث TypeScript Types

#### 2.1 تحديث `Task` interface في `types/index.ts`:
```typescript
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  assignedTo?: string;        // NEW: employee UUID
  assignedName?: string;      // KEEP: for display (denormalized)
  createdBy?: string;         // NEW: employee UUID who created
  createdByName?: string;     // NEW: for display
  completedAt?: string;       // NEW
  recurrence: TaskRecurrence; // ADD to interface (exists as type)
  category?: string;          // NEW
  relatedReportId?: string;
  relatedReportNumber?: string;
}
```

#### 2.2 إضافة صلاحية جديدة:
```typescript
// في PERMISSIONS array
{ id: 'tasks_manage', label: 'إدارة المهام', description: 'إنشاء وإسناد وتعديل المهام', category: 'المهام' },
{ id: 'tasks_view', label: 'عرض المهام', description: 'عرض المهام المسندة', category: 'المهام' },

// في ROLE_DEFAULT_PERMISSIONS
admin: [...all..., 'tasks_manage', 'tasks_view'],
appraiser: ['tasks_view', ...],
reviewer: ['tasks_view', ...],
data_entry: ['tasks_view', ...],
viewer: ['tasks_view'],
```

### المرحلة 3: تحديث Store

#### 3.1 تحديث `mapTaskRow` و `taskToSnake`:
- إضافة `assigned_to` → `assignedTo`
- إضافة `created_by` → `createdBy`
- إضافة `created_by_name` → `createdByName`
- إضافة `completed_at` → `completedAt`
- إضافة `recurrence` → `recurrence`
- إضافة `category` → `category`

#### 3.2 إضافة طرق جديدة:
```typescript
// فلترة المهام حسب المستخدم
getTasksForUser: (userId: string): Task[] => ...
getMyTasks: (): Task[] => store.getTasksForUser(store.getCurrentUserId()!)

// مهام اليوم
getTodayTasks: (userId?: string): Task[] => ...

// إحصائيات المهام
getTaskStats: (userId?: string): { total, pending, inProgress, completed, overdue } => ...
```

#### 3.3 تحديث `addTask`:
- تعيين `createdBy` تلقائياً من `getCurrentUserId()`
- إرسال إشعار للموظف المسند (`addNotification`)

#### 3.4 تحديث `completeTask`:
- تعيين `completedAt` + `status: 'completed'`

### المرحلة 4: تحديث صفحة المهام (`/tasks/page.tsx`)

#### 4.1 عرض حسب الدور:
- **Admin**: يرى كل المهام + يمكنه إضافة/تعديل/حذف
- **موظف عادي**: يرى مهامه فقط (`assigned_to = userId`)
- تبويبات: "مهامي" / "كل المهام" (admin فقط)

#### 4.2 نموذج إضافة مهمة محسّن:
- **حقل "المُسند إليه"**: dropdown من قائمة الموظفين (بدل نص حر)
- **حقل "التصنيف"**: dropdown (عام/تثمين/متابعة/إداري)
- **حقل "التكرار"**: dropdown (بدون/يومي/أسبوعي/شهري)
- **حقل "تقرير مرتبط"**: اختيار من قائمة التقارير
- تعيين `createdBy` تلقائياً

#### 4.3 إشعارات:
- عند إسناد مهمة → إشعار للموظف
- عند اقتراب الموعد (يوم واحد) → تذكير
- عند اكتمال المهمة → إشعار للمسؤول

### المرحلة 5: إضافة Realtime للمهام

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
```

### الملفات المطلوب تعديلها:
1. `supabase/schema.sql` - إضافة الأعمدة الجديدة
2. `src/types/index.ts` - تحديث Task + PERMISSIONS
3. `src/lib/store.ts` - تحديث mappers + إضافة طرق جديدة
4. `src/app/tasks/page.tsx` - تحديث واجهة المستخدم بالكامل
5. `src/lib/validations.ts` - تحديث schema المهمة

### التحقق والاختبار:
1. المسؤول ينشئ مهمة ويسندها لموظف
2. الموظف يرى المهمة في صفحة مهامه
3. الموظف يكمل المهمة → المسؤول يرى الإكمال
4. الإشعارات تعمل عند الإسناد والإكمال
5. المهام المتأخرة تتحدث تلقائياً
6. الفلترة والبحث يعملان بشكل صحيح
