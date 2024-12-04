import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DragAndDrop from './drag/DragAndDrop'; // DragAndDrop 컴포넌트 임포트

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DragAndDrop />} />
      </Routes>
    </Router>
  );
};

export default App;
