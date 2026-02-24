import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Training from './pages/Training'
import RAG from './pages/RAG'
import FineTuning from './pages/FineTuning'
import Inference from './pages/Inference'
import Compare from './pages/Compare'
import Paths from './pages/Paths'
import Glossary from './pages/Glossary'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="training" element={<Training />} />
        <Route path="rag" element={<RAG />} />
        <Route path="fine-tuning" element={<FineTuning />} />
        <Route path="inference" element={<Inference />} />
        <Route path="compare" element={<Compare />} />
        <Route path="paths" element={<Paths />} />
        <Route path="glossary" element={<Glossary />} />
      </Route>
    </Routes>
  )
}

export default App
