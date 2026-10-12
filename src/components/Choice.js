import React from "react"
import Header from "./Header";
import style from "./components.module.css";
import Button from "./Button";
import {connect} from "react-redux";
import { writeRecordStartOrFinish} from "../redux/actions/userAction";
import {Modal} from "react-bootstrap";
import {closeAlertInStore} from "../redux/actions/appAction";

const Choice = (props) => {

    return (
        <div>
            <Header/>
            <div className={`container card ${style.card_menu} container mt-5`}>
                <div className="card-body row align-items-center justify-content-center">
                    <div className="col-6 d-flex justify-content-center">
                        <button
                            onClick={() => props.writeRecordStartOrFinish(true, props.user)}
                            type="button"
                            className="btn btn-primary button-choice"
                        >start
                        </button>
                    </div>
                    <div className="col-6 d-flex justify-content-center">
                        <button
                            onClick={() => props.writeRecordStartOrFinish(false, props.user)}
                            type="button"
                            className="btn btn-primary button-choice"
                        >finish
                        </button>
                    </div>
                </div>
            </div>
            <div className="d-flex justify-content-center mt-5">
                <Button color={"btn-outline-danger"} title={"BACK to MENU"}/>
            </div>
            <Modal show={props.showInStore} onHide={()=>props.closeAlertInStore()}>
                <Modal.Body>{props.alert}</Modal.Body>
            </Modal>
        </div>
    )
}

const mapStateToProps = state => {
    return {
        user: state.user.user,
        alert: state.app.alert,
        showInStore:state.app.show
    }
}

const mapDispatchToProps = {
    writeRecordStartOrFinish,
    // showAlertInStore,
    closeAlertInStore
}

export default connect(mapStateToProps, mapDispatchToProps)(Choice);