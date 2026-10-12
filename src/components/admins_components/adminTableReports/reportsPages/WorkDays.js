import React, {useEffect} from "react";
import {getNumWorkDay, pageTableSwitch, saveNumWorkday} from "../../../../redux/actions/appAction";
import {connect} from "react-redux";


const WorkDays = (props) => {

    useEffect(() => {
        if (props.params.startDate) {
            props.getNumWorkDay(props.params)
        }
    })

    useEffect(() => {
        return () => {
            props.saveNumWorkday(0);
        }
    }, [])

    function getName() {
        let user = props.employees.filter((empl) => empl.idUser == props.params.idUser);
        return user[0].firstName + " " + user[0].lastName;
    }

    return (
        <div className="container mt-5">
            <div className="row ">
                <div className="col-12 text-center">
                    <p>In range which you piked <b>{getName()}</b> worked:</p>
                </div>
                <div className="col-12 text-center">
                    <b>{props.workDays}</b> days.
                </div>

            </div>

        </div>
    )
}

const mapStateToProps = state => {
    return {
        workDays: state.app.workDays,
        params: state.app.dataForRequest,
        employees: state.app.employees
    }
}

const mapDispatchToProps = {
    getNumWorkDay,
    saveNumWorkday,
    pageTableSwitch
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkDays);