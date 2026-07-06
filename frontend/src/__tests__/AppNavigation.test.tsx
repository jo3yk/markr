import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { virtual } from '@guidepup/virtual-screen-reader';
import App from '../App';

const fakeTests = {
  tests: [
    {
      test_id: 'test-1',
      student_count: 5,
      marks_available: 10,
    },
  ],
};

const fakeAggregate = {
  mean: 72.3,
  stddev: 9.1,
  min: 50,
  max: 92,
  p25: 65,
  p50: 73,
  p75: 82,
  count: 5,
};

const fakeHistogram = {
  total: 5,
  bins: [
    { lower_pct: 0, upper_pct: 20, count: 0 },
    { lower_pct: 21, upper_pct: 40, count: 1 },
    { lower_pct: 41, upper_pct: 60, count: 1 },
    { lower_pct: 61, upper_pct: 80, count: 2 },
    { lower_pct: 81, upper_pct: 100, count: 1 },
  ],
};

function createFetchMock() {
  return vi.fn((input: RequestInfo) => {
    const url = typeof input === 'string' ? input : input.url;

    if (url.endsWith('/tests')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fakeTests),
      });
    }

    if (url.endsWith('/aggregate')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fakeAggregate),
      });
    }

    if (url.endsWith('/histogram')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fakeHistogram),
      });
    }

    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  });
}

describe('App navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('navigates from upload to tests and detail pages', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();

    render(<App />);

    expect(screen.getByRole('heading', { name: /upload exam results/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /^tests$/i }));

    expect(await screen.findByRole('heading', { name: /tests/i })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /view details for test test-1/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /view details for test test-1/i }));

    expect(await screen.findByRole('heading', { name: /test test-1/i })).toBeInTheDocument();
    expect(await screen.findByText(/aggregate statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/score distribution/i)).toBeInTheDocument();
  });

  it('renders a histogram that is announced correctly to screen reader users', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('link', { name: /^tests$/i }));
    await user.click(await screen.findByRole('link', { name: /view details for test test-1/i }));

    await virtual.start({ container: document.body });

    const spokenLog = [] as string[];
    while ((await virtual.lastSpokenPhrase()) !== 'end of document') {
      spokenLog.push(await virtual.lastSpokenPhrase());
      await virtual.next();
    }
    spokenLog.push(await virtual.lastSpokenPhrase());

    expect(spokenLog).toBeInstanceOf(Array);
    expect(spokenLog).toContain('image, Histogram of scores for test test-1');
    expect(spokenLog.some((phrase) => phrase.includes('scored between 0 and 20 percent'))).toBe(true);
    expect(spokenLog.some((phrase) => phrase.includes('scored between 21 and 40 percent'))).toBe(true);

    await virtual.stop();
  });
});
