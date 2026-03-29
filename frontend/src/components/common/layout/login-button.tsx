import { Link } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

export function LoginButton(): React.JSX.Element {
  return (
    <Button
      data-slot="login-button"
      data-test-id="login-btn"
      asChild
      variant="outline"
      size="sm"
    >
      <Link
        to="/"
        data-test-id="login-link"
      >
        <LogIn className="size-4 mr-2" />
        Entrar
      </Link>
    </Button>
  );
}
