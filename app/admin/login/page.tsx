import { login } from "@/app/actions/admin";
import { ActionForm, Submit } from "@/components/ActionForm";
import { Field } from "@/components/Field";
import { Page, PublicHeader } from "@/components/Layout";

export const metadata = { title: "Admin login", robots: { index: false } };

export default function LoginPage() {
  return (
    <>
      <PublicHeader />
      <Page>
        <h1 className="font-display text-2xl font-extrabold">Organiser login</h1>
        <ActionForm action={login} className="flex flex-col gap-4">
          <Field label="Email" name="email" type="email" autoComplete="username" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          <Submit>Log in</Submit>
        </ActionForm>
      </Page>
    </>
  );
}
