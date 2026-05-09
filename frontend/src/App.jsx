import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import WorkflowPage from './features/workflow/WorkflowPage';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/workflow" element={<WorkflowPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;