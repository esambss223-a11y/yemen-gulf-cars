This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

انسخ `.env.example` إلى `.env.local` واملأ قيم مشروع Supabase من لوحة التحكم (Project Settings > API):

```bash
cp .env.example .env.local
```

| المتغير | الاستخدام |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | عنوان المشروع (يُبنى معه العميل العام) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح النشر للعميل — آمن فقط مع سياسات RLS المشددة في `supabase-schema.sql` |
| `SUPABASE_SERVICE_ROLE_KEY` | للسيرفر فقط (Route Handlers) — لا يُستورد في مكونات العميل أبداً |

الملف الموحد للجداول وسياسات الأمان هو `supabase-schema.sql`. افتحه من المشروع، وانسخ محتواه إلى **Supabase → SQL Editor → New query**، ثم راجعه قبل الضغط على **Run**. يتضمن الملف سياسات لكل جداول التطبيق وأدوار الموظفين. عند تشغيل الملف على قاعدة قائمة، تُستبدل سياسات RLS الحالية للجداول المذكورة، بينما إنشاء الجداول والبذور يستخدم `IF NOT EXISTS` و`ON CONFLICT DO NOTHING`.

## إعداد موظفي لوحة الإدارة (Bootstrap)

تسجيل دخول اللوحة موثّق عبر Supabase Auth، ولا يمكن الدخول إلا لموظف نشط موجود في جدول `staff`. يتيح تبويب فريق العمل للمدير العام إضافة الموظفين وتعديل بياناتهم وأدوارهم وكلمات مرورهم وحذفهم:

1. أنشئ أول حساب موظف مدير عام في لوحة Supabase: **Authentication → Users → Add user**، فعّل Auto-confirm، ثم أضف صفه في `staff` باستخدام UUID الخاص بحساب Auth:

```sql
INSERT INTO public.staff (id, name, username, role, phone, active)
VALUES ('<USER_UUID>', 'اسم الموظف', 'username', 'super_admin', '+20 100 000 0000', true);
```

2. بعد تسجيل الدخول بهذا المدير العام، أضف بقية الموظفين من تبويب فريق العمل. الموظف يدخل من `/admin` باسم المستخدم الإنجليزي وكلمة المرور؛ البريد الداخلي لا يظهر في شاشة الدخول. كلمات المرور تُدار بواسطة Supabase Auth ولا تُحفظ في جدول الموظفين. لا يُرسل مفتاح الخدمة إلى المتصفح.

> صلاحيات الأدوار في الملف: المدير العام يدير بيانات اللوحة، موظف التأجير يدير الحجوزات والعملاء، والمحاسب يطّلع على الحجوزات والملاك والفواتير. الموقع العام يستطيع عرض السيارات المتاحة وإرسال طلب حجز، ولا يستطيع قراءة ملفات العملاء أو الحجوزات أو بيانات الملاك والفواتير.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
