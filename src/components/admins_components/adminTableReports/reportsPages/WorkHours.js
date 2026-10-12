import React, {useEffect} from "react";
import {getHoursInRange, pageTableSwitch, saveWorkHours} from "../../../../redux/actions/appAction";
import {connect} from "react-redux";

const WorkHours = (props) => {

    let seconds = props.workHours
    let hour = 0;
    let minutes = 0;
    if (seconds) {
        seconds *= 60;
        hour = Math.floor(seconds / 3600);
        minutes = Math.floor((seconds %= 3600) / 60);
    }

    useEffect(() => {
        if (props.params.startDate) {
            props.getHoursInRange(props.params)
        }
    })

    useEffect(() => {
    }, [props.workHours])

    useEffect(() => {
        return () => {
            props.saveWorkHours(0);
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
                    <p>In range which you piked work hours of <b>{getName()}</b> is</p>
                </div>
                <div className="col-12 text-center">
                    <p>Hours: <b>{hour}</b></p>
                </div>
                <div className="col-12 text-center">
                    <p>Minutes: <b>{minutes}</b></p>
                </div>
            </div>
        </div>
    )
}
const mapStateToProps = state => {
    return {
        workHours: state.app.workHours,
        params: state.app.dataForRequest,
        employees: state.app.employees
    }
}
const mapDispatchToProps = {
    getHoursInRange,
    saveWorkHours,
    pageTableSwitch
}
export default connect(mapStateToProps, mapDispatchToProps)(WorkHours);