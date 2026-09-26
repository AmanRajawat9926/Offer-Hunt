import { useEffect, useState } from 'react';

const STARTING_APPLICATIONS = [
  { id: 1, company: 'Zoho', round: 'Applied', expectedLpa: 6, followedUp: false },
  { id: 2, company: 'Freshworks', round: 'Screen', expectedLpa: 8, followedUp: true },
  { id: 3, company: 'Razorpay', round: 'Interview', expectedLpa: 12, followedUp: false },
  { id: 4, company: 'Chargebee', round: 'Applied', expectedLpa: 9, followedUp: false },
  { id: 5, company: 'Postman', round: 'Screen', expectedLpa: 14, followedUp: false },
];

const LOCAL_STORAGE_KEY = 'offer_hunt_applications_v1';

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
  // Requirement 1: Lazy state initialization from localStorage with seed fallback
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch {
        return STARTING_APPLICATIONS;
      }
    }
    return STARTING_APPLICATIONS;
  });

  const [query, setQuery] = useState('');
  const [roundFilter, setRoundFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [secondsOpen, setSecondsOpen] = useState(0);
  const [serverMatches, setServerMatches] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [draftNum, setDraftNum] = useState('');

  // Requirement 1: Persist applications to localStorage whenever state updates
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  // Defect 1 Fix: Timer updater
  useEffect(() => {
    const tick = setInterval(() => setSecondsOpen((prev) => prev + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  // Defect 3 Fix: Primitive dependency array for pagination reset
  useEffect(() => {
    setPage(1);
  }, [query, roundFilter]);

  // Defect 6 Fix: Race condition handling with active flag
  useEffect(() => {
    if (query.trim() === '') {
      setServerMatches(null);
      return;
    }

    let active = true;

    lookupApplications(query, applications).then((found) => {
      if (active) {
        setServerMatches(found);
      }
    });

    return () => {
      active = false;
    };
  }, [query, applications]);

  const visible = applications
    .filter((x) => x.company.toLowerCase().includes(query.toLowerCase()))
    .filter((x) => roundFilter === 'All' || x.round === roundFilter);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);
  const shown = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Defect 5 Fix: Immutable toggle
  function toggleFollowedUp(x) {
    setApplications((prev) =>
      prev.map((item) =>
        item.id === x.id ? { ...item, followedUp: !item.followedUp } : item
      )
    );
  }

  function removeApplication(x) {
    setApplications((prev) => prev.filter((it) => it.id !== x.id));
  }

  return (
    <div className="app">
      <h1>Offer Hunt</h1>
      <p className="timer">Time on page: {secondsOpen}s</p>

      <NewApplicationForm
        draftText={draftText}
        setDraftText={setDraftText}
        draftNum={draftNum}
        setDraftNum={setDraftNum}
        applications={applications}
        setApplications={setApplications}
      />

      <div className="filters">
        <input
          placeholder="Search applications…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)}>
          <option>All</option>
          <option>Applied</option>
          <option>Screen</option>
          <option>Interview</option>
          <option>Offer</option>
        </select>
      </div>

      {/* Requirement 2: Correct count display under filtering, search & pagination */}
      <p className="showing-count">
        Showing {shown.length} of {visible.length} applications
      </p>

      {serverMatches !== null && (
        <p className="matches">
          Server search: {serverMatches.length} match(es) for “{query}”
        </p>
      )}

      <ul className="rows">
        {shown.map((x) => (
          /* Defect 4 Fix: Unique key using x.id */
          <ApplicationRow
            key={x.id}
            application={x}
            onToggle={() => toggleFollowedUp(x)}
            onRemove={() => removeApplication(x)}
          />
        ))}
      </ul>

      <div className="pager">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>
          {' '}page {page} of {pageCount}{' '}
        </span>
        <button disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

// Requirement 3 & Personal Constraint: Validation, Enter-to-submit & Escape-to-cancel
function NewApplicationForm({
  draftText,
  setDraftText,
  draftNum,
  setDraftNum,
  setApplications,
  applications,
}) {
  const isCompanyEmpty = draftText.trim() === '';
  const isCtcInvalid = draftNum === '' || Number(draftNum) <= 0;
  const isValid = !isCompanyEmpty && !isCtcInvalid;

  let validationMessage = '';
  if (isCompanyEmpty && isCtcInvalid) {
    validationMessage = 'Please enter a company name and a valid expected CTC (> 0).';
  } else if (isCompanyEmpty) {
    validationMessage = 'Company name cannot be empty.';
  } else if (isCtcInvalid) {
    validationMessage = 'Expected CTC must be greater than 0.';
  }

  function submit(e) {
    e.preventDefault();
    if (!isValid) return;

    setApplications([
      {
        id: Date.now(),
        company: draftText.trim(),
        round: 'Applied',
        expectedLpa: Number(draftNum),
        followedUp: false,
      },
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
    <form className="new-entry" onSubmit={submit} onKeyDown={handleKeyDown}>
      <input
        placeholder="Company name"
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
      />
      <input
        placeholder="Expected CTC (LPA)"
        type="number"
        value={draftNum}
        onChange={(e) => setDraftNum(e.target.value)}
      />
      <button type="submit" disabled={!isValid}>
        Add application
      </button>

      {validationMessage && (
        <p className="validation-message" style={{ color: 'red', fontSize: '0.85rem' }}>
          {validationMessage}
        </p>
      )}
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
      <span> · {application.round} · {application.expectedLpa} LPA </span>
      <input
        className="note"
        placeholder="Prep note…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button onClick={onRemove}>Remove</button>
    </li>
  );
}