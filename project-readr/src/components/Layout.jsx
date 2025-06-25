import { WelcomeNavbar } from "./WelcomeNavbar"
import { HomepageNavbar } from "./HomepageNavbar"
import { NavigationTabs } from "./NavigationTabs"
import { Outlet, useLocation } from "react-router-dom"

export function Layout(){
    const location = useLocation();
    const isHomepageOrBook = location.pathname === "/Homepage" || location.pathname === "/Book" || location.pathname === "/Profile";
    const showNavigationTabs = location.pathname === "/Homepage" || location.pathname === "/Author" || location.pathname === "/Discover" || location.pathname === "/Book";

    return(
        <>
            {isHomepageOrBook ? <HomepageNavbar /> : <WelcomeNavbar />}
            {showNavigationTabs && <NavigationTabs />}
            <main>
                <Outlet/>
            </main>
        </>
    )
}
