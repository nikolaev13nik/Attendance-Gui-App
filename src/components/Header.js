import React from "react"
import style from "./components.module.css"
import myLogo from "../images/logoaviv.png"

const Header = () => {

    return (
        <div className="container-fluid m-0 p-0">
            <div className={`row justify-content-around align-content-center ${style.header}`}>
                <div className=" ">
                    <h1>Welcome</h1>
                </div>
                <div className="">
                    <img  className={"logo"} src={myLogo} color={"white"} alt={"logo"}/>
                </div>
            </div>
        </div>
    )
};
export default Header

