import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders heading', () => {
  render(<App />);
  expect(screen.getByText(/Markr/i)).toBeInTheDocument();
});
