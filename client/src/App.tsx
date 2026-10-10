import { ActionQueuePanel } from './components/ActionQueuePanel'

function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-5 px-5 py-8 text-gray-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">MarginGuard</h1>
        <p className="mt-1 text-sm text-gray-400">
          Rows the importer couldn't confidently classify land here. Resolve
          them so they enter your books.
        </p>
      </div>

      <ActionQueuePanel />

      <p className="text-xs text-gray-500">
        Pending decisions live in the server's memory; they are lost when it
        restarts. The queue refreshes every 5 seconds.
      </p>
    </main>
  )
}

export default App
