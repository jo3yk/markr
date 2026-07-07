import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import TestsPage from './pages/TestsPage';
import TestDetailPage from './pages/TestDetailPage';
import NavigationMenu from './components/NavigationMenu';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <NavigationMenu />
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/tests/:testId" element={<TestDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
