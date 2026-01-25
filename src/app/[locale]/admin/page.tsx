import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth/admin";

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  const isAuth = await isAdminAuthenticated();

  if (isAuth) {
    redirect(`/${locale}/admin/pricing`);
  } else {
    redirect(`/${locale}/admin/login`);
  }
}
