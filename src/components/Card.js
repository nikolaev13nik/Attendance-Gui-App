import React, { useState} from "react"
import style from "./components.module.css"
import Collapse from "react-bootstrap/Collapse";
import {connect} from "react-redux";
import {loginAction} from "../redux/actions/userAction";
import {closeAlertInStore} from "../redux/actions/appAction";
import {Modal} from "react-bootstrap";

const Card = (props) => {

    const [open, setOpen] = useState(false);
    const [state, setState] = useState({password: ""});


    const handlerInput = (event) => {
        event.persist();
        setState(prevState => ({...prevState, ...{password: event.target.value}}))

    };
    const handlerSubmit = () => {

        props.employee.password = state.password
        props.loginAction(props.employee, props.flagLogin)
        setState({
            password: ""
        });
    };

    return (
        <div className={`container card ${style.card_menu} container mt-4`}>
            <div className="card-body row align-items-center justify-content-center">
                <div className="col-12 d-flex align-items-center justify-content-center">
                    <button className="btn-card btn btn-lg mb-3" onClick={() => setOpen(!open)}
                    >{props.employee.firstName + " " + props.employee.lastName}
                    </button>
                </div>
                <div className="col-12 d-flex align-items-center justify-content-center ">
                    <Collapse in={open}>
                        <label className="input-card">Password
                            <input type="password"
                                   name="password"
                                   value={state.password}
                                   onChange={handlerInput}
                                   className="form-control"
                            />
                            <button type="submit"
                                    onClick={handlerSubmit}
                                    className="btn btn-outline-secondary mt-2">submit
                            </button>
                            <small className="form-text text-muted">
                                Your password must be 0-20 characters long.
                            </small>
                        </label>
                    </Collapse>
                </div>
                <Modal show={props.showInStore} onHide={() => props.closeAlertInStore()}>
                    <Modal.Body>{props.alert}</Modal.Body>
                </Modal>
            </div>
        </div>
    )
};

const mapStateToProps = state => {
    return {
        flagLogin: state.app.flagLogin,
        alert: state.app.alert,
        showInStore: state.app.show
    }
}

const mapDispatchToProps = {
    loginAction,
    closeAlertInStore
};

export default connect(mapStateToProps, mapDispatchToProps)(Card);

