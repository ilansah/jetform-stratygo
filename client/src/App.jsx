import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicForm from './pages/PublicForm';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
