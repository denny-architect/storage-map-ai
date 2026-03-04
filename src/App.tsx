import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'

import Compare from './pages/Compare'
import Paths from './pages/Paths'
import Glossary from './pages/Glossary'
import Explorer from './pages/Explorer'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />

        <Route path="compare" element={<Compare />} />
        <Route path="explorer" element={<Explorer />} />
        <Route path="paths" element={<Paths />} />
        <Route path="glossary" element={<Glossary />} />
      </Route>
    </Routes>
  )
}

export default App
