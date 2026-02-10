import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';

interface LoginProps {
  status?: string;
  canResetPassword: boolean;
  canRegister: boolean;
}

export default function Login({
  status,
  canResetPassword,
  canRegister,
}: LoginProps) {
  return (
    <AuthLayout
      title="Acceso al sistema"
      description="Gestión de tickets y procesos internos"
    >
      <Head title="Iniciar sesión" />

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-100">
            Bienvenido
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <Form
          {...store.form()}
          resetOnSuccess={['password']}
          className="flex flex-col gap-6"
        >
          {({ processing, errors }) => (
            <>
              {/* Usuario */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-slate-300">
                  Usuario / Email
                </Label>
                <Input
                  id="email"
                  type="text"
                  name="email"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="suamy.lagos"
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                />
                <InputError message={errors.email} />
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-slate-300">
                    Contraseña
                  </Label>
                  {canResetPassword && (
                    <TextLink
                      href={request()}
                      className="ml-auto text-xs text-amber-400 hover:text-amber-300"
                    >
                      ¿Olvidaste tu contraseña?
                    </TextLink>
                  )}
                </div>

                <Input
                  id="password"
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                />
                <InputError message={errors.password} />
              </div>

              {/* Remember */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="remember"
                  name="remember"
                  className="border-slate-700 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <Label htmlFor="remember" className="text-sm text-slate-400">
                  Recordarme
                </Label>
              </div>

              {/* Botón */}
              <Button
                type="submit"
                disabled={processing}
                className="mt-4 w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-semibold hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg"
              >
                {processing && <Spinner />}
                Ingresar al sistema
              </Button>

              {/* Registro */}
              {canRegister && (
                <div className="text-center text-sm text-slate-400">
                  ¿No tienes cuenta?{' '}
                  <TextLink
                    href={register()}
                    className="text-amber-400 hover:text-amber-300 font-medium"
                  >
                    Solicitar acceso
                  </TextLink>
                </div>
              )}
            </>
          )}
        </Form>

        {status && (
          <div className="mt-4 text-center text-sm font-medium text-emerald-400">
            {status}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
