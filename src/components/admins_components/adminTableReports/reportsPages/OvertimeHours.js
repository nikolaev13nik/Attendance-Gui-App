import React, {useEffect} from "react";
import {
    getHoursInRange,
    getOverTimeInRange,
    pageTableSwitch,
    saveOvertimeHours,
    saveWorkHours
} from "../../../../redux/actions/appAction";
import {connect} from "react-redux";

const OvertimeHours = (props) => {

    let seconds = props.overtimeHours;
    let hour = 0;
    let minutes = 0;

    if (seconds) {
        seconds *= 60;
        hour = Math.floor(seconds / 3600);
        minutes = Math.floor((seconds %= 3600) / 60);
    }

    useEffect(() => {
        if (props.params.startDate) {
            props.getOverTimeInRange(props.params)
        }
    })

    useEffect(() => {
        return () => {
            props.saveOvertimeHours(0);
        }
    }, [])

    function getName() {
        let user = props.employees.filter((empl) => empl.idUser == props.params.idUser);
        return user[0].firstName + " " + user[0].lastName;
    }

    return (
        <div className="container mt-5">
            <div className="row">
                <div className="col-12 text-center">
                    <p>In range which you piked overtime hours of <b>{getName()}</b> is</p>
                </div>
                <div className="col-12 text-center">
                    <p>Hours: <b>{hour}</b></p>
                </div>
                <div className="col-12 text-center">
                    <p>Minutes: <b>{minutes}</b></p>
                </div>
                <div className="col-12 text-center">
                    <p>Put attention these hours includes in common number work hours.</p>
                </div>
            </div>
        </div>
    )
}
const mapStateToProps = state => {
    return {
        overtimeHours: state.app.overtimeHours,
        params: state.app.dataForRequest,
        employees: state.app.employees
    }
}
const mapDispatchToProps = {
    getHoursInRange,
    saveOvertimeHours,
    pageTableSwitch,
    getOverTimeInRange
}
export default connect(mapStateToProps, mapDispatchToProps)(OvertimeHours);