import React from "react"
import {connect} from "react-redux";
import {pageNavigationAction} from "../redux/actions/appAction";


export const Button=(props)=>{
    return <button

        onClick={()=>props.pageNavigationAction("Menu")}
        type="button"
        className={`btn ${props.color}`}>{props.title}</button>
}

const mapDispatchToProps={
    pageNavigationAction
}

export default connect (null,mapDispatchToProps)(Button);