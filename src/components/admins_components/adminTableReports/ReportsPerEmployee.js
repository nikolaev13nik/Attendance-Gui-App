import React, {useEffect, useState} from "react";
import {connect} from "react-redux";
import {
    getEmployeesWithoutAdminAction, getRecordsInRange,
    getRowsWithNull,
    pageNavigationSubAdminAction, pageTableSwitch, saveDateForRequestTable, switchPageReports
} from "../../../redux/actions/appAction";
import ReportsSwitcher from "./ReportsSwitcher";
import {removeAllRecords} from "../../../redux/actions/tableAction";
import FrameRecordTable from "./reportsPages/FrameRecordTable";


const ReportsPerEmployee = (props) => {

    let valueSubmitButton = "";
    let flag = false;
    const [user, setUser] = useState({idUser: ""});
    const [fixedArrayEmployees, setFixedArrayEmployees] = useState([])
    const [showSubMenu, setShowSubMenu] = useState(false);

    useEffect(() => {
        props.getEmployeesWithoutAdminAction();
    }, [])

    useEffect(() => {
        const defaultObg = {idUser: "", firstName: "none", lastName: "selected"}
        setFixedArrayEmployees([defaultObg, ...props.employees]);
    }, [props.employees])

    const handlerInput = (event) => {
        event.persist();
        setUser(prevState => ({...prevState, ...{[event.target.name]: event.target.value}}))
    };

    useEffect(() => {
        return () => {
            console.log("unm RePerEmpl 38 " + props.records)
            props.switchPageReports("")
            props.removeAllRecords()
            props.pageTableSwitch("")
        }
    }, [])

    const handlerSubmit = (e) => {
        e.preventDefault()
        props.saveDateForRequestTable(user)

        if (valueSubmitButton == "records") {
            props.getRecordsInRange()
        }
        if (valueSubmitButton !== "") {
            props.getRowsWithNull(user)
        }
        props.switchPageReports(valueSubmitButton)
    };
    if ("" === props.page) {
        return (<div>
                <div className="container mt-5 border border p-4 ">
                    <form className="form-group" onSubmit={handlerSubmit}>

                        <div className="row justify-content-center">
                            <div className="col-8">
                                <label>Choose, whom employee you want get for manipulation</label>
                                <select className="form-control"
                                        onChange={handlerInput}
                                        name="idUser"
                                        required>
                                    {fixedArrayEmployees.map((employee, index) => <option className="optional"
                                                                                          value={employee.idUser}
                                                                                          key={index}>{employee.firstName + " " + employee.lastName}
                                    </option>)}</select>
                            </div>
                        </div>
                        <div className="row justify-content-center mt-2">
                            <div className="col-4">
                                <label>From:
                                    <input type="date"
                                           name="startDate"
                                           placeholder="dd/mm/yyyy"
                                           required
                                           onChange={handlerInput}
                                           className="form-control"/>
                                </label>
                            </div>
                            <div className="col-4 d-flex justify-content-end">
                                <label>To:
                                    <input type="date"
                                           name="finishDate"
                                           placeholder="dd/mm/yyyy"
                                           required
                                           onChange={handlerInput}
                                           className="form-control"/>
                                </label>
                            </div>
                        </div>
                            <div className=" row mt-3 justify-content-center ">
                                <button type="submit"
                                        onClick={() => valueSubmitButton = "records"}
                                        name="action"
                                        value="records"
                                        className="btn btn-outline-secondary ml-2 mr-2">Records
                                </button>
                                <button type="submit"
                                        name="action"
                                        value="workDays"
                                        onClick={() => valueSubmitButton = "workDays"}
                                        className="btn btn-outline-secondary ml-2 mr-2">Numbers work days
                                </button>
                                <button type="submit"
                                        name="action"
                                        value="workHours"
                                        onClick={() => valueSubmitButton = "workHours"}
                                        className="btn btn-outline-secondary ml-2 mr-2">Num work hours
                                </button>
                                <button type="submit"
                                        name="action"
                                        value="overTime"
                                        onClick={() => valueSubmitButton = "overTime"}
                                        className="btn btn-outline-secondary ml-2 mr-2">Overtime hours
                                </button>
                            </div>
                    </form>
                </div>
            </div>
        )
    } else if ("records" === props.page) {
        return (
            <div>
                <div className="container mt-5 border border p-4">
                    <form className="form-group" onSubmit={handlerSubmit}>
                        <div className="row justify-content-center">
                            <div className="col-8">
                                <label>Choose, whom employee you want get for manipulation</label>
                                <select className="form-control"
                                        onChange={handlerInput}
                                        name="idUser"
                                        required>
                                    {fixedArrayEmployees.map((employee, index) => <option className="optional"
                                                                                          value={employee.idUser}
                                                                                          key={index}>{employee.firstName + " " + employee.lastName}
                                    </option>)}</select>
                            </div>
                        </div>
                        <div className="row justify-content-center mt-2">
                            <div className="col-4">
                                <label>From:
                                    <input type="date"
                                           name="startDate"
                                           placeholder="dd/mm/yyyy"
                                           required
                                           onChange={handlerInput}
                                           className="form-control"/>
                                </label>
                            </div>
                            <div className="col-4 d-flex justify-content-end">
                                <label>To:
                                    <input type="date"
                                           name="finishDate"
                                           placeholder="dd/mm/yyyy"
                                           required
                                           onChange={handlerInput}
                                           className="form-control"/>
                                </label>
                            </div>

                        </div>

                        <div className=" row mt-3 justify-content-center ">
                            <button type="submit"
                                    onClick={() => valueSubmitButton = "records"}
                                    name="action"
                                    value="records"
                                    className="btn btn-outline-secondary ml-2 mr-2">Records
                            </button>
                            <button type="submit"
                                    name="action"
                                    value="workDays"
                                    onClick={() => valueSubmitButton = "workDays"}
                                    className="btn btn-outline-secondary ml-2 mr-2">Numbers work days
                            </button>
                            <button type="submit"
                                    name="action"
                                    value="workHours"
                                    onClick={() => valueSubmitButton = "workHours"}
                                    className="btn btn-outline-secondary ml-2 mr-2">Num work hours
                            </button>
                            <button type="submit"
                                    name="action"
                                    value="overTime"
                                    onClick={() => valueSubmitButton = "overTime"}
                                    className="btn btn-outline-secondary ml-2 mr-2">Overtime hours
                            </button>
                        </div>
                    </form>
                </div>
                <FrameRecordTable/>
            </div>
        )
    } else {
        return (
            <div>
                <div className="container mt-5 border border p-4">
                    <form className="form-group" onSubmit={handlerSubmit}>
                        <div className="row justify-content-center">
                            <div className="col-8">
                                <label>Choose, whom employee you want get for manipulation</label>
                                <select className="form-control"
                                        onChange={handlerInput}
                                        name="idUser"
                                        required>
                                    {fixedArrayEmployees.map((employee, index) => <option className="optional"
                                                                                          value={employee.idUser}
                                                                                          key={index}>{employee.firstName + " " + employee.lastName}
                                    </option>)}</select>
                            </div>
                        </div>
                        <div className="row justify-content-center mt-2">
                            <div className="col-4">
                                <label>From:
                                    <input type="date"
                                           name="startDate"
                                           placeholder="dd/mm/yyyy"
                                        // value={date.date}
                                           required
                                           onChange={handlerInput}
                                           className="form-control"/>
                                </label>
                            </div>
                            <div className="col-4 d-flex justify-content-end">
                                <label>To:
                                    <input type="date"
                                           name="finishDate"
                                           placeholder="dd/mm/yyyy"
                                        // value={date.date}
                                           required
                                           onChange={handlerInput}
                                           className="form-control"/>
                                </label>
                            </div>
                        </div>
                        <div className=" row mt-3 justify-content-center ">
                            <button type="submit"
                                // onClick={()=>props.pageTableSwitch("recordsInRange")}
                                // onClick={()=>flag=true}
                                    onClick={() => valueSubmitButton = "records"}
                                    name="action"
                                    value="records"
                                    className="btn btn-outline-secondary ml-2 mr-2">Records
                            </button>
                            <button type="submit"
                                    name="action"
                                    value="workDays"
                                    onClick={() => valueSubmitButton = "workDays"}
                                // onClick={()=>props.pageTableSwitch("numberWorkDays")}
                                    className="btn btn-outline-secondary ml-2 mr-2">Numbers work days
                            </button>
                            <button type="submit"
                                    name="action"
                                    value="workHours"
                                    onClick={() => valueSubmitButton = "workHours"}
                                // onClick={()=>props.pageTableSwitch("countHours")}
                                    className="btn btn-outline-secondary ml-2 mr-2">Num work hours
                            </button>
                            <button type="submit"
                                    name="action"
                                    value="overTime"
                                    onClick={() => valueSubmitButton = "overTime"}
                                // onClick={()=>props.pageTableSwitch("overtimeHours")}
                                    className="btn btn-outline-secondary ml-2 mr-2">Overtime hours
                            </button>
                        </div>
                    </form>
                </div>
                <ReportsSwitcher/>
            </div>
        )
    }


}

const mapStateToProps = state => {
    return {
        userAuth: state.user.user,
        employees: state.app.employees,
        records: state.tableData.records,
        params: state.app.dataForRequest,
        recordsInRange: state.app.arrayRecords,
        page: state.app.switcherReports
    }
}

const mapDispatchToProps = {
    pageNavigationSubAdminAction,
    getEmployeesWithoutAdminAction,
    getRowsWithNull,
    saveDateForRequestTable,
    removeAllRecords,
    pageTableSwitch,
    getRecordsInRange,
    switchPageReports
}

export default connect(mapStateToProps, mapDispatchToProps)(ReportsPerEmployee);
