import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { History } from './pages/History';
import { Result } from './pages/Result';
import { HistoryProvider } from './context/HistoryContext';
import './App.css';

function App() {
  return (
    <HistoryProvider>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/result/:id" element={<Result />} />
          </Routes>
        </main>
      </div>
    </HistoryProvider>
  );
}

export default App;
