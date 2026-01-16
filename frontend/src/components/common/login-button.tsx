import { Link } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

export function LoginButton(): React.JSX.Element {
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
    >
      <Link to="/">
        <LogIn className="size-4 mr-2" />
        Entrar
      </Link>
    </Button>
  );
}
