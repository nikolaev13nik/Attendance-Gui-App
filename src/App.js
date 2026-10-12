import React from "react";
import Menu from "./components/Menu";
import Header from "./components/Header";
import Cards from "./components/Cards";
import Choice from "./components/Choice";
import {connect} from "react-redux";
import Button from "./components/Button";
import AdminFrame from "./components/admins_components/AdminFrame";



function App(props) {

    switch (props.page) {
        case "":
            return <Menu/>

        case "Cards":
            return (<div className="frame0">
                     <Header/>
                      <Cards/>
                         <div className="d-flex justify-content-center mt-3 pb-5">
                        <Button color={"btn-outline-danger"} title={"MENU"} />
                         </div>
                      </div>)
        case "Choice":
            return <Choice/>

        case "AdminFrame":return <AdminFrame/>

        default:
            return <Menu/>

    }
}

const mapStateToProps = state => {
    return {
        page: state.app.page,
    }
}

export default connect(mapStateToProps, null)(App);
