import { WelcomeNavbar } from "./WelcomeNavbar"
import { HomepageNavbar } from "./HomepageNavbar"
import  Footer  from "./Footer"
import { Outlet, useLocation } from "react-router-dom"

export function Layout(){
    const location = useLocation();
  
    const isHomepage = location.pathname === "/Homepage" || location.pathname === "/AddProfile" || location.pathname === "/Profile" || location.pathname ==="/ReadingList" || location.pathname ==="/Home" || location.pathname ==="/Discover" || location.pathname ==="/Book" || location.pathname ==="/Author" || location.pathname === "/Genre";

    return(
        <>
            {isHomepage ? <HomepageNavbar /> : <WelcomeNavbar />}
            <main>
                <Outlet/>
            </main>
            <Footer />
        </>
    )
}
