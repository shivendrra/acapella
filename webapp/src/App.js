import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// importing components
import Lander from './components/Lander';

function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<Lander/>}/>
      </Routes>
    </Router>
    </>
  );
}

export default App;
