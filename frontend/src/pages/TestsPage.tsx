import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TestSummary } from '../types';
import { fetchTests } from '../api/client';

export default function TestsPage() {
  const [tests, setTests] = useState<TestSummary[] | null>(null);
  const [testsError, setTestsError] = useState<string | null>(null);
  const [loadingTests, setLoadingTests] = useState(false);

  useEffect(() => {
    // Load the available tests once when the page mounts.
    setLoadingTests(true);
    setTestsError(null);
    fetchTests()
      .then((tests) => {
        setTests(tests);
      })
      .catch((err) => {
        setTestsError(err instanceof Error ? err.message : 'Unable to load tests');
        setTests([]);
      })
      .finally(() => setLoadingTests(false));
  }, []);

  return (
    <div className="app-shell">

      <main>
        <section aria-labelledby="tests-heading">
          <h2 id="tests-heading">Tests</h2>

          {loadingTests ? (
            <p>Loading tests…</p>
          ) : testsError ? (
            <div role="alert" aria-live="assertive" className="error">
              Unable to load tests: {testsError}
            </div>
          ) : tests && tests.length > 0 ? (
            <table>
              <caption className="sr-only">Available test summaries</caption>
              <thead>
                <tr>
                  <th scope="col">Test ID</th>
                  <th scope="col">Students</th>
                  <th scope="col">Marks available</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.test_id}>
                    <td>
                      <Link to={`/tests/${encodeURIComponent(test.test_id)}`} aria-label={`View details for test ${test.test_id}`}>
                        {test.test_id}
                      </Link>
                    </td>
                    <td>{test.student_count}</td>
                    <td>{test.marks_available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>
              <p>No tests uploaded yet.</p>
              <p>
                <Link to="/">Back to upload</Link>
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
