import React, {useEffect} from "react"
import Card from "./Card";
import {connect} from "react-redux";
import {removeUsersFromStore} from "../redux/actions/appAction";


const Cards = (props) => {

    useEffect(() => {
        return () => {
            props.removeUsersFromStore()
        }
    }, [])

    if (!props.employees.length) {
        return <h2>Not there are registered employees, please use admin menu to add new worker.</h2>
    } else {
        return (
            props.employees.map(employee => <Card employee={employee} key={employee.idUser}/>)
        )
    }
}

const mapDispatchToProps = {
    removeUsersFromStore
}

const mapStateToProps = (state) => {
    return {
        employees: state.app.employees
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Cards);

