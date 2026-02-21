import Link from "next/link"

export const dynamic = "force-static"

export default function WorkflowPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Workflow Builder Is Disabled</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This route is currently offline while workflow editing is rebuilt on top of the main SVG canvas.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          You can still create workflows using the AI assistant on the main page.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to main canvas
        </Link>
      </section>
    </main>
  )
}
