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
import { AddInfo } from './pages/AddInfo'
import { Profile } from './pages/Profile'
import { ReadingList } from './pages/ReadingList'
import  Author  from './pages/Author'
import { Book } from './pages/Book' 
import DiscoverPage from './pages/DiscoverPage'

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
          <Route path="/AddInfo" element={<AddInfo />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/ReadingList" element={<ReadingList />} />
          <Route path="/Author" element={<Author />} />
          <Route path="/Book" element={<Book />} />
          <Route path="/DiscoverPage" element={<DiscoverPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
