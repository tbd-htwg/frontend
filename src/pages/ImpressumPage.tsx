import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TEAM_MEMBERS } from '../data/teamMembers'

export function ImpressumPage() {
  useEffect(() => {
    document.title = 'Impressum — Trip Planner'
    return () => {
      document.title = 'Trip Planner'
    }
  }, [])

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-slate-500">
        <Link to="/" className="font-medium text-slate-700 hover:underline">
          ← Back to home
        </Link>
      </p>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Impressum</h1>
      <p className="mt-2 text-sm text-slate-600">
        Angaben gemäß § 5 TMG (Telemediengesetz) für das studentische Projekt{' '}
        <span className="font-medium text-slate-800">Trip Planner</span> im Rahmen der
        Veranstaltung Cloud Application Development.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Verantwortlich für den Inhalt
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Die folgenden Personen sind als Projektgruppe für diese Anwendung verantwortlich.
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th scope="col" className="px-4 py-3 font-semibold text-slate-800">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-slate-800">
                  E-Mail
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-slate-800">
                  Matrikelnr.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {TEAM_MEMBERS.map((m) => (
                <tr key={`${m.email}-${m.matrikelnummer}`}>
                  <td className="px-4 py-3 text-slate-900">{m.fullName}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`mailto:${m.email}`}
                      className="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
                    >
                      {m.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">{m.matrikelnummer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 border-t border-slate-200 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Haftungsausschluss
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die
          Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich
          deren Betreiber verantwortlich.
        </p>
      </section>
    </div>
  )
}
