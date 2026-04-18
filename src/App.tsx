import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LibraryScreen from './features/library/LibraryScreen';
import ImportScreen from './features/import/ImportScreen';
import ScraperScreen from './features/scraper/ScraperScreen';
import TranslationScreen from './features/translation/TranslationScreen';
import SettingsScreen from './features/settings/SettingsScreen';

import ReaderScreen from './features/reader/ReaderScreen';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LibraryScreen />} />
          <Route path="/reader/:bookId" element={<ReaderScreen />} />
          <Route path="/import" element={<ImportScreen />} />
          <Route path="/scraper" element={<ScraperScreen />} />
          <Route path="/translation" element={<TranslationScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </Layout>
    </Router>
  );
}
