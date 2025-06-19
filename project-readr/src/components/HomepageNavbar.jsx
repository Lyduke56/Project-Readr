import "./HomepageNavbar.css"

export function HomepageNavbar() {
    return (
        <>
            <div className="welcome-navbar">
                <div className="nav-left">
                    <h1>Readr</h1>
                </div>

                <div className="nav-right">
                    <div className="overlap-2">
                        <button className="icon-button" onClick={() => console.log('Menu clicked')}>
                            <img className="icon" alt="Menu icon" src="menu.png" />
                        </button>
                        <button className="icon-button" onClick={() => console.log('Bell clicked')}>
                            <img className="icon" alt="Bell icon" src="bell.png" />
                        </button>
                        <div className="group">
                            <div className="overlap-group-2">
                                <div className="text-wrapper-18">chaechae143</div>
                                <img className="icon" alt="Dropdown icon" src="down.png" />
                            </div>
                        </div>
                        <img className="mask-group" alt="Profile picture" src="Chaewon.png" />
                    </div>
                </div>
            </div>
        </>
    )
}
