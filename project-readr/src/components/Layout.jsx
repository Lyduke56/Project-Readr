import { WelcomeNavbar } from "./WelcomeNavbar"
import { Outlet } from "react-router-dom"

export function Layout(){
    return(
        <>
            <WelcomeNavbar/>
            <main>
                <Outlet/>
            </main>
        </>
    )
}