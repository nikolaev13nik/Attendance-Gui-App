import React, {useEffect, useState} from "react";
import {editEmployeeAction} from "../../../redux/actions/manageEmployeeAction";
import {
    closeAlertInStore,
    getEmployeesWithoutAdminAction,
    pageNavigationSubAdminAction
} from "../../../redux/actions/appAction";
import {connect} from "react-redux";
import {Modal} from "react-bootstrap";


const FormEditEmployee = (props) => {

    const [fixedArrayEmployees, setFixedArrayEmployees] = useState([])
    const [state, setState] = useState({
        idUser: "",
        firstName: "",
        lastName: "",
        password: ""
    });


    const handlerInput = (event) => {
        event.persist();
        setState(prevState => ({...prevState, ...{[event.target.name]: event.target.value}}))
    };
    useEffect(() => {
        props.getEmployeesWithoutAdminAction();
    }, [])

    useEffect(() => {
        const defaultObg = {idUser: "", firstName: "none", lastName: "selected"}
        setFixedArrayEmployees([defaultObg, ...props.employees]);
    }, [props.employees])


    const handlerSubmit = (event) => {
        event.preventDefault()
        props.editEmployeeAction(state, props.userAuth)
        setState({
            idUser: "",
            firstName: "",
            lastName: "",
            password: ""
        });
    };

    return (
        <div className="container mt-5">
            <div className="row">
                <div className="col-10">
                    <form onSubmit={handlerSubmit}>
                        <div className="form-group">
                            <label>Choose, whom employee you want change:</label>
                            <select className="form-control"
                                    onChange={handlerInput}
                                    name="idUser"
                                    required>
                                {fixedArrayEmployees.map((employee, index) => <option value={employee.idUser}
                                                                                      key={index}>{employee.firstName + " " + employee.lastName}
                                </option>)}</select>
                        </div>
                        <div className="form-group">
                            <label>First Name</label>
                            <input type="text"
                                   pattern="\D+"
                                   name="firstName"
                                   value={state.firstName}
                                   className="form-control"
                                   onChange={handlerInput}/>
                        </div>
                        <div className="form-group">
                            <label>First Name</label>
                            <input type="text"
                                   pattern="\D+"
                                   name="lastName"
                                   value={state.lastName}
                                   className="form-control"
                                   onChange={handlerInput}/>
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="number"
                                   min="1"
                                   max="999999999"
                                   className="form-control"
                                   placeholder="only number"
                                   name="password"
                                   value={state.password}
                                   onChange={handlerInput}/>
                        </div>
                        <button type="submit"
                                className="btn button-submit mt-2">Submit
                        </button>
                    </form>
                </div>
            </div>
            <Modal show={props.showInStore} onHide={() => props.closeAlertInStore()}>
                <Modal.Body>{props.alert}</Modal.Body>
            </Modal>
        </div>
    )
}
const mapStateToProps = state => {
    return {
        userAuth: state.user.user,
        employees: state.app.employees,
        alert: state.app.alert,
        showInStore: state.app.show
    }
}
const mapDispatchToProps = {
    pageNavigationSubAdminAction,
    getEmployeesWithoutAdminAction,
    editEmployeeAction,
    closeAlertInStore,
}
export default connect(mapStateToProps, mapDispatchToProps)(FormEditEmployee);