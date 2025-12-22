import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_private/tables/$slug/field/$fieldId/')({
  component: RouteComponent,
});

function RouteComponent(): React.JSX.Element {
  return <div>Hello "/_private/tables/$slug/field/$fieldId/"!</div>;
}
