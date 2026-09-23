// Offer Hunt — stage 2 starter. Replace src/App.jsx of a fresh Vite React
// project with this file, then: npm install && npm run dev
import { useEffect, useState } from 'react';

const STARTING_APPLICATIONS = [
  { id: 1, company: 'Zoho', round: 'Applied', expectedLpa: 6, followedUp: false },
  { id: 2, company: 'Freshworks', round: 'Screen', expectedLpa: 8, followedUp: true },
  { id: 3, company: 'Razorpay', round: 'Interview', expectedLpa: 12, followedUp: false },
  { id: 4, company: 'Chargebee', round: 'Applied', expectedLpa: 9, followedUp: false },
  { id: 5, company: 'Postman', round: 'Screen', expectedLpa: 14, followedUp: false },
];

// Simulated server-side lookup (no network needed): longer queries answer faster.
function lookupApplications(q, applications) {
  const wait = 900 - Math.min(q.length * 150, 700);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(applications.filter((x) => x.company.toLowerCase().includes(q.toLowerCase())));
    }, wait);
  });
}

const PAGE_SIZE = 3;

export default function App() {
  const [applications, setApplications] = useState(STARTING_APPLICATIONS);
  const [query, setQuery] = useState('');
  const [roundFilter, setRoundFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [secondsOpen, setSecondsOpen] = useState(0);
  const [serverMatches, setServerMatches] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [draftNum, setDraftNum] = useState('');

  // useEffect(() => {
  //   const tick = setInterval(() => setSecondsOpen(secondsOpen + 1), 1000);
  //   return () => clearInterval(tick);
  // }, []);

  useEffect(() => {
  const tick = setInterval(() => setSecondsOpen((prev) => prev + 1), 1000);
  return () => clearInterval(tick);
}, [])

  // const activeView = { search: query, round: roundFilter };

  // useEffect(() => {
  //   setPage(1); // back to page 1 whenever the view changes
  // }, [activeView]);

  useEffect(() => {
    setPage(1);
  }, [query, roundFilter]);

  useEffect(() => {
    if (query.trim() === '') { setServerMatches(null); return; }
    lookupApplications(query, applications).then((found) => setServerMatches(found));
  }, [query, applications]);

  const visible = applications
    .filter((x) => x.company.toLowerCase().includes(query.toLowerCase()))
    .filter((x) => roundFilter === 'All' || x.round === roundFilter);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const shown = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleFollowedUp(x) {
    x.followedUp = !x.followedUp;
    setApplications(applications);
  }

  function removeApplication(x) {
    setApplications(applications.filter((it) => it.id !== x.id));
  }

  

  return (
    <div className="app">
      <h1>Offer Hunt</h1>
      <p className="timer">Time on page: {secondsOpen}s</p>
      <NewApplicationForm />
      <div className="filters">
        <input placeholder="Search applications…" value={query}
          onChange={(e) => setQuery(e.target.value)} />
        <select value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)}>
          <option>All</option>
          <option>Applied</option>
          <option>Screen</option>
          <option>Interview</option>
          <option>Offer</option>
        </select>
      </div>
      {serverMatches !== null && (
        <p className="matches">Server search: {serverMatches.length} match(es) for “{query}”</p>
      )}
      <ul className="rows">
        {/* {shown.map((x, index) => (
          <ApplicationRow key={index} application={x}
            onToggle={() => toggleFollowedUp(x)} onRemove={() => removeApplication(x)} />
        ))} */}
        {shown.map((x) => (
          <ApplicationRow key={x.id} application={x}
          onToggle={() => toggleFollowedUp(x)} onRemove={() => removeApplication(x)} />
        ))}
      </ul>
      <div className="pager">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span> page {page} of {pageCount} </span>
        <button disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
function NewApplicationForm({ draftText, setDraftText, draftNum, setDraftNum, setApplications, applications }) {
    function submit(e) {
      e.preventDefault();
      if (draftText.trim() === '' || Number(draftNum) <= 0) return;
      setApplications([
        { id: Date.now(), company: draftText.trim(), round: 'Applied', expectedLpa: Number(draftNum), followedUp: false },
        ...applications,
      ]);
      setDraftText('');
      setDraftNum('');
    }

    function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setDraftText('');
      setDraftNum('');
    }
  }
    return (
      <form className="new-entry" onSubmit={submit}>
        <input placeholder="Company name" value={draftText}
          onChange={(e) => setDraftText(e.target.value)} />
        <input placeholder="Expected CTC (LPA)" type="number" value={draftNum}
          onChange={(e) => setDraftNum(e.target.value)} />
        <button type="submit">Add application</button>
      </form>
    );
  }
function ApplicationRow({ application, onToggle, onRemove }) {
  const [note, setNote] = useState('');
  return (
    <li className="row">
      <label>
        <input type="checkbox" checked={application.followedUp} onChange={onToggle} />
        {' '}Followed up
      </label>
      <b> {application.company} </b>
      <span> · {application.round} · {application.expectedLpa} </span>
      <input className="note" placeholder="Prep note…" value={note}
        onChange={(e) => setNote(e.target.value)} />
      <button onClick={onRemove}>Remove</button>
    </li>
  );
}