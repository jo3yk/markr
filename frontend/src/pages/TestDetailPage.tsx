import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchAggregate, fetchHistogram } from '../api/client';
import { AggregateSummary, HistogramData } from '../types';

export default function TestDetailPage() {
  const { testId } = useParams<{ testId: string }>();
  const [aggregate, setAggregate] = useState<AggregateSummary | null>(null);
  const [histogram, setHistogram] = useState<HistogramData | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLastRefreshed, setDetailLastRefreshed] = useState<string | null>(null);
  const [detailAnnouncement, setDetailAnnouncement] = useState<string | null>(null);
  const detailVersionRef = useRef<string | null>(null);
  const detailIntervalRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!testId) {
      setDetailError('Test not found');
      return;
    }

    // Reset cancellation flag for new testId
    cancelledRef.current = false;
    setDetailLoading(true);
    setDetailError(null);
    setDetailAnnouncement(null);
    detailVersionRef.current = null;

    const fetchDetail = async (announce = false) => {
      // Check if this request has been cancelled before making API calls
      if (cancelledRef.current) {
        return;
      }

      try {
        const [aggBody, histogramBody] = await Promise.all([
          fetchAggregate(testId),
          fetchHistogram(testId),
        ]);

        // Guard all setState calls - check if still valid after async operations
        if (cancelledRef.current) {
          return;
        }

        const newVersion = JSON.stringify({ aggBody, histogramBody });
        if (announce && detailVersionRef.current && detailVersionRef.current !== newVersion) {
          setDetailAnnouncement(`Results updated for test ${testId}`);
        }
        detailVersionRef.current = newVersion;
        setAggregate(aggBody);
        setHistogram(histogramBody);
        setDetailLastRefreshed(new Date().toLocaleTimeString());
      } catch (err) {
        // Guard setState in catch block
        if (cancelledRef.current) {
          return;
        }
        setDetailError(err instanceof Error ? err.message : 'Unable to load test details');
        setAggregate(null);
        setHistogram(null);
        setDetailLastRefreshed(null);
      } finally {
        // Guard setState in finally block
        if (!cancelledRef.current) {
          setDetailLoading(false);
        }
      }
    };

    fetchDetail();

    if (detailIntervalRef.current) {
      window.clearInterval(detailIntervalRef.current);
    }
    detailIntervalRef.current = window.setInterval(() => fetchDetail(true), 10000);

    return () => {
      // Set cancellation flag to prevent stale state updates
      cancelledRef.current = true;
      if (detailIntervalRef.current) {
        window.clearInterval(detailIntervalRef.current);
        detailIntervalRef.current = null;
      }
    };
  }, [testId]);

  return (
    <div className="app-shell">

      <main>
        <section aria-labelledby="test-detail-heading">
          <h2 id="test-detail-heading">Test {testId}</h2>

          {detailLoading ? (
            <p>Loading test details…</p>
          ) : detailError ? (
            <div role="alert" aria-live="assertive" className="error">
              <p>{detailError}</p>
              <p>
                <Link to="/tests">Back to tests</Link>
              </p>
            </div>
          ) : (
            <>
              <div className="detail-header">
                <p aria-live="polite" className="status-announcement" style={{ minHeight: '1.5rem' }}>
                  {detailAnnouncement}
                </p>
                <p className="last-refreshed">Last refreshed: {detailLastRefreshed ?? '—'}</p>
              </div>

              {aggregate && histogram ? (
                <>
                  <section aria-labelledby="stats-heading" className="stats-section">
                    <h3 id="stats-heading">Aggregate statistics</h3>
                    <div className="stats-grid" role="list">
                      <div role="listitem">
                        <p className="stat-item">
                          <span className="stat-label">Mean</span>
                          <span className="stat-value">{aggregate.mean.toFixed(1)}%</span>
                        </p>
                      </div>
                      <div role="listitem">
                        <p className="stat-item">
                          <span className="stat-label">Count</span>
                          <span className="stat-value">{aggregate.count}</span>
                        </p>
                      </div>
                      <div role="listitem">
                        <p className="stat-item">
                          <span className="stat-label">P25</span>
                          <span className="stat-value">{aggregate.p25.toFixed(1)}%</span>
                        </p>
                      </div>
                      <div role="listitem">
                        <p className="stat-item">
                          <span className="stat-label">P50</span>
                          <span className="stat-value">{aggregate.p50.toFixed(1)}%</span>
                        </p>
                      </div>
                      <div role="listitem">
                        <p className="stat-item">
                          <span className="stat-label">P75</span>
                          <span className="stat-value">{aggregate.p75.toFixed(1)}%</span>
                        </p>
                      </div>
                      <div role="listitem">
                        <p className="stat-item">
                          <span className="stat-label">Min</span>
                          <span className="stat-value">{aggregate.min.toFixed(1)}%</span>
                        </p>
                      </div>
                      <div role="listitem">
                        <p className="stat-item">
                          <span className="stat-label">Max</span>
                          <span className="stat-value">{aggregate.max.toFixed(1)}%</span>
                        </p>
                      </div>
                      <div role="listitem">
                        <p className="stat-item">
                          <span className="stat-label">Std dev</span>
                          <span className="stat-value">{aggregate.stddev.toFixed(1)}%</span>
                        </p>
                      </div>
                    </div>
                  </section>

                  <section aria-labelledby="histogram-heading" className="histogram-section">
                    <h3 id="histogram-heading">Score distribution</h3>
                    <div role="img" aria-label={`Histogram of scores for test ${testId}`} className="histogram">
                      {histogram.bins.map((bin) => {
                        const width = histogram.total > 0 ? `${(bin.count / histogram.total) * 100}%` : '0%';
                        const isEmpty = bin.count === 0;
                        const label = `${bin.lower_pct}–${bin.upper_pct}`.padStart(8, ' ')
                        return (
                          <div key={`${bin.lower_pct}-${bin.upper_pct}`} className="histogram-row">
                            <span className="histogram-bar-label" aria-hidden="true">
                              {label}
                            </span>
                            <div
                              className={`histogram-bar${isEmpty ? ' histogram-bar-empty' : ''}`}
                              style={{ width: isEmpty ? '0.5rem' : width }}
                              aria-label={`${bin.count} student${bin.count === 1 ? '' : 's'} scored between ${bin.lower_pct} and ${bin.upper_pct} percent`}
                            />
                            <span className="histogram-count-label" >
                              {bin.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </>
              ) : null}

            </>
          )}
        </section>
      </main>
    </div>
  );
}