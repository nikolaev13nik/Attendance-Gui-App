import React, {useState} from "react";
import {connect} from "react-redux";
import {addNewEmployee} from "../../../redux/actions/manageEmployeeAction";
import {closeAlertInStore, pageNavigationSubAdminAction} from "../../../redux/actions/appAction";
import {Modal} from "react-bootstrap";


const FormAddEmployee = (props) => {

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

    const handlerSubmit = (event) => {
        event.preventDefault()
        props.addNewEmployee(state);
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
                            <label>Employee id:</label>
                            <input type="number"
                                   required
                                   min="1"
                                   max="999999999"
                                   name="idUser"
                                   value={state.idUser}
                                   className="form-control"
                                   placeholder="only number"
                                   onChange={handlerInput}/>
                        </div>

                        <div className="form-group">
                            <label>First Name:</label>
                            <input type="text"
                                   required
                                   pattern="\D+"
                                   name="firstName"
                                   value={state.firstName}
                                   onChange={handlerInput}
                                   className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name:</label>
                            <input type="text"
                                   required
                                   pattern="\D+"
                                   name="lastName"
                                   value={state.lastName}
                                   className="form-control"
                                   onChange={handlerInput}/>
                        </div>
                        <div className="form-group">
                            <label>Password:</label>
                            <input type="number"
                                   required
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
        alert: state.app.alert,
        showInStore: state.app.show
    }
}
const mapDispatchToProps = {
    addNewEmployee,
    pageNavigationSubAdminAction,
    closeAlertInStore,
}
export default connect(mapStateToProps, mapDispatchToProps)(FormAddEmployee);