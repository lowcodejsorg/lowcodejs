import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import React, { useState } from 'react';

import { StepCode } from './-step-code';
import { StepEmail } from './-step-email';
import { StepPassword } from './-step-password';

export const Route = createLazyFileRoute('/_authentication/forgot-password/')({
  component: RouteComponent,
});

type Step = 'email' | 'code' | 'password';

function RouteComponent(): React.JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');

  function handleEmailNext(submittedEmail: string): void {
    setEmail(submittedEmail);
    setStep('code');
  }

  function handleCodeNext(_code: string): void {
    setStep('password');
  }

  function handleSuccess(): void {
    router.navigate({ to: '/', replace: true });
  }

  return (
    <div
      data-test-id="forgot-password-page"
      className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {step === 'email' && <StepEmail onNext={handleEmailNext} />}
          {step === 'code' && (
            <StepCode
              email={email}
              onNext={handleCodeNext}
              onBack={() => setStep('email')}
            />
          )}
          {step === 'password' && <StepPassword onSuccess={handleSuccess} />}
        </div>
      </div>
    </div>
  );
}
