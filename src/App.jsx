import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { IframeRouteSync } from './components/IframeRouteSync';
import { 
  Home, 
  CollegeExplorer, 
  CollegeDetail, 
  Cutoffs,
  Quota,
  Eligibility,
  PreferenceSheet, 
  SubjectCombination,
  Rankings,
  Documents,
  AdminContent
} from './pages';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <IframeRouteSync />
        <Navbar />
        <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/colleges" element={<CollegeExplorer />} />
          <Route path="/college/:id" element={<CollegeDetail />} />
          <Route path="/eligibility" element={<Eligibility />} />
          <Route path="/cutoffs" element={<Cutoffs />} />
          <Route path="/quota" element={<Quota />} />
          <Route path="/preference-sheet" element={<PreferenceSheet />} />
          <Route path="/subject-combination" element={<SubjectCombination />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/admincontent" element={<AdminContent />} />
        </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
