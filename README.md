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

بعد إعداد قاعدة البيانات بشغل `supabase-schema.sql`، تأكد أن سياسات RLS مفعّلة كما هو موثق في الملف: القراءة العامة مقتصرة على كتالوج السيارات وتسجيل الزيارات، وكل الجداول الحساسة محصورة بالموظفين الموثقين.

## إعداد موظفي لوحة الإدارة (Bootstrap)

تسجيل دخول اللوحة موثّق عبر Supabase Auth، ولا يمكن الدخول إلا لمن يوجد له سجل في جدول `staff`:

1. أنشئ حساب الموظف في لوحة Supabase: **Authentication → Users → Add user** باستخدام بريد الموظف وكلمة مروره، مع تفعيل Auto-confirm. البريد يُستخدم داخلياً فقط لربط الحساب؛ الموظف يدخل إلى الموقع باسم المستخدم الموجود في `staff.username` وكلمة المرور.
2. انسخ الـ UUID الخاص بالمستخدم وأضف سجله في جدول staff بتشغيل:

```sql
INSERT INTO public.staff (id, name, username, role, phone, active)
VALUES ('<USER_UUID>', 'اسم الموظف', 'username', 'super_admin', '+20 100 000 0000', true);
```

3. سجّل الدخول من `/admin` باسم الموظف بالإنجليزية وكلمة المرور. يربط الخادم اسم الموظف بحساب Auth، ولا يرسل مفتاح الخدمة إلى المتصفح.

> ملاحظة: تبويب "فريق العمل" يدير النسخة المحلية من الدليل (localStorage) حالياً؛ الربط الكامل لإنشاء الموظفين مع جدول staff السحابي يأتي في مرحلة لاحقة.

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
