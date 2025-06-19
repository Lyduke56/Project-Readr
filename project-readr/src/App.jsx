import './App.css'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { About } from './pages/About' 
import { Features } from './pages/Features'
import { WelcomePage } from './pages/WelcomePage'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { Home } from './pages/Home'
import { Homepage } from './pages/Homepage'

function App() {

  return (
    <Router>
      <Routes>
        <Route element={<Layout/>}>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/Features" element={<Features/>} />
          <Route path="/About" element={<About/>} />
          <Route path="/SignIn" element={<SignIn/>} />
          <Route path="/SignUp" element={<SignUp/>} />
          <Route path="/Home" element={<Home/>} />
          <Route path="/Homepage" element={<Homepage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
