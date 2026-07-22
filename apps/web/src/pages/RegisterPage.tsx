import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, FlaskConical, FileCheck } from "lucide-react";
import clsx from "clsx";
import { registerSchema, type RegisterInput, type AuthUser } from "@buildscience/shared";
import { FormField, Input, PasswordInput, PhoneInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";
import { api, ApiRequestError } from "@/lib/api";
import { dashboardPathForRole } from "@/routes/paths";
import { notify } from "@/components/ui/toast";

export default function RegisterPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = params.get("role") === "SCIENTIST" ? "SCIENTIST" : "COMPANY";
  const [role, setRole] = useState<"COMPANY" | "SCIENTIST" | "EXPERT">(initialRole as any);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: initialRole },
  });

  function selectRole(next: "COMPANY" | "SCIENTIST" | "EXPERT") {
    setRole(next);
    setValue("role", next);
  }

  async function onSubmit(values: RegisterInput) {
    try {
      const user = await api.post<AuthUser>("/auth/register", values);
      setUser(user);
      navigate(dashboardPathForRole(user.role));
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.errors) {
          for (const [field, messages] of Object.entries(err.errors)) {
            setError(field as keyof RegisterInput, { message: messages[0] });
          }
        }
        notify.error(err.message);
      }
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-brand-dark">Ro'yxatdan o'tish</h1>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Rolni tanlang">
        <button
          type="button"
          onClick={() => selectRole("COMPANY")}
          aria-pressed={role === "COMPANY"}
          className={clsx(
            "flex flex-col items-center gap-2 rounded-card border-2 p-5 text-center transition-colors",
            role === "COMPANY" ? "border-brand-primary bg-brand-primary/5" : "border-surface-border bg-white"
          )}
        >
          <Building2 className={role === "COMPANY" ? "text-brand-primary" : "text-ink-muted"} size={28} />
          <span className="font-medium text-brand-dark">Korxona</span>
        </button>
        <button
          type="button"
          onClick={() => selectRole("SCIENTIST")}
          aria-pressed={role === "SCIENTIST"}
          className={clsx(
            "flex flex-col items-center gap-2 rounded-card border-2 p-5 text-center transition-colors",
            role === "SCIENTIST" ? "border-brand-primary bg-brand-primary/5" : "border-surface-border bg-white"
          )}
        >
          <FlaskConical className={role === "SCIENTIST" ? "text-brand-primary" : "text-ink-muted"} size={28} />
          <span className="font-medium text-brand-dark">Olim</span>
        </button>
        <button
          type="button"
          onClick={() => selectRole("EXPERT")}
          aria-pressed={role === "EXPERT"}
          className={clsx(
            "flex flex-col items-center gap-2 rounded-card border-2 p-5 text-center transition-colors",
            role === "EXPERT" ? "border-brand-primary bg-brand-primary/5" : "border-surface-border bg-white"
          )}
        >
          <FileCheck className={role === "EXPERT" ? "text-brand-primary" : "text-ink-muted"} size={28} />
          <span className="font-medium text-brand-dark">Ekspert</span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label={role === "COMPANY" ? "Korxona nomi" : "F.I.Sh."} required error={errors.name?.message} htmlFor="name">
          <Input id="name" {...register("name")} />
        </FormField>

        <FormField label="Email" required error={errors.email?.message} htmlFor="email">
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </FormField>

        <FormField label="Telefon raqami" required error={errors.phone?.message} htmlFor="phone">
          <PhoneInput id="phone" {...register("phone")} />
        </FormField>

        {role === "SCIENTIST" && (
          <>
            <FormField label="Mutaxassislik" error={errors.specialization?.message} htmlFor="specialization">
              <Input id="specialization" {...register("specialization")} />
            </FormField>
            <FormField label="OTM yoki tashkilot" error={errors.organization?.message} htmlFor="organization">
              <Input id="organization" {...register("organization")} />
            </FormField>
          </>
        )}

        <FormField label="Parol" required helperText="Kamida 8 ta belgi" error={errors.password?.message} htmlFor="password">
          <PasswordInput id="password" autoComplete="new-password" {...register("password")} />
        </FormField>

        <FormField label="Parolni takrorlang" required error={errors.passwordConfirm?.message} htmlFor="passwordConfirm">
          <PasswordInput id="passwordConfirm" autoComplete="new-password" {...register("passwordConfirm")} />
        </FormField>

        <Button type="submit" isLoading={isSubmitting} className="mt-2">
          Ro'yxatdan o'tish
        </Button>
      </form>

      <p className="text-center text-sm text-ink-muted">
        Akkauntingiz bormi?{" "}
        <Link to="/login" className="font-medium text-brand-primary">
          Kirish
        </Link>
      </p>
    </div>
  );
}
