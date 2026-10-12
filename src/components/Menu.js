import React from "react"
import Header from "./Header";
import {getEmployeesAction} from "../redux/actions/appAction";
import {connect} from "react-redux";
// import style from "./components.module.css"

const Menu = (props) => {

    return (
        <div>
            <Header/>
            <div className="container mt-5 pt-5">
                <div className="row align-items-center justify-content-center">

                    <div className="col-6">
                        <button
                            onClick={() => props.getEmployeesAction(false)}
                            type="button"
                            className="btn btn-lg btn-outline-secondary mb-3 btn-employee">Employee
                        </button>
                    </div>
                    <div className="col-6">
                        <button type="button"
                                onClick={() => props.getEmployeesAction(true)}
                                className="btn btn-lg  mb-3 btn-administrator">Administrator
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const mapDispatchToProps = {
    getEmployeesAction
}

export default connect(null, mapDispatchToProps)(Menu)
