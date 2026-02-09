import { PageLayout, useDatagrok } from '@datagrok/app-kit'

export default function HomePage() {
  const { currentUser } = useDatagrok()

  return (
    <PageLayout title="{{APP_NAME_PASCAL}}" nav={[]}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-lg border border-border bg-muted p-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground">{{APP_NAME_PASCAL}}</h2>
          <p className="mt-2 text-muted-foreground">Welcome to the {{APP_NAME_PASCAL}} app.</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Signed in as{' '}
            <span className="font-medium text-foreground">{currentUser.displayName}</span>
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
