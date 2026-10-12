import React, {useState} from "react";
import {Button, Modal, OverlayTrigger, Tooltip} from "react-bootstrap";
import {deleteRecordAction, editRecordAction} from "../../../redux/actions/tableAction";
import {connect} from "react-redux";
import {
    closeAlertInStore,
    getRowsWithNull,
    saveAlertToStore,
    saveDateForRequestTable,
    showAlertInStore
} from "../../../redux/actions/appAction";


const RowTablesReports = (props) => {

    let placeHolderStart = "09:00";
    let placeHolderFinish = "20:00";

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [state, setState] = useState({
        start: props.user.start,
        finish: props.user.finish,
    });

    if (props.user.start) {
        const index = state.start.indexOf("T")
        state.start = state.start.substring(index + 1, 16);
    }

    if (props.user.finish) {
        const index = state.finish.indexOf("T")
        state.finish = state.finish.substring(index + 1, 16);
    }

    let total = "none"

    const handlerOnChange = e => {
        setState(prevState => ({...prevState, ...{[e.target.name]: e.target.value}}))
    }

    function validationDateBeforeFetch(date, nameTime) {
        let pattern = new RegExp("^(2[0-3]|[01][0-9]):([0-5][0-9])$");

        function checkForCorrectTiming() {

            if (nameTime === "finish" && props.user.start) {
                let finishHours = +date.slice(0, 2);
                let finishMin = +date.slice(3);
                let startDate = new Date(props.user.start)
                let startHours = +startDate.getHours()
                let startMin = +startDate.getMinutes()
                if ((startHours > finishHours) || (startHours === finishHours && finishMin < startMin)) {
                    return false;
                }
            }

            if (nameTime === "start" && props.user.finish) {
                let startHours = +date.slice(0, 2);
                let startMin = +date.slice(3);
                let finishDate = new Date(props.user.finish)
                let finishHours = +finishDate.getHours()
                let finishMin = +finishDate.getMinutes()
                if ((startHours > finishHours) || (startHours === finishHours && finishMin < startMin)) {
                    return false;
                }
            }
            return true;
        }

        if (pattern.test(date) && checkForCorrectTiming()) {
            return true
        }
        return false;
    }

    const handlerOnBlur = e => {
        if (validationDateBeforeFetch(e.target.value, e.target.name)) {
            let oldTime = props.user[e.target.name];
            let record;
            let newTime;
            if (oldTime != null) {
                const index = oldTime.indexOf("T")
                newTime = oldTime.substring(0, index + 1)
                newTime += e.target.value + ":00"
            } else {
                newTime = props.user.date + "T" + e.target.value + ":00";
            }
            record = props.user;
            record = {...record, [e.target.name]: newTime}

            props.editRecordAction(record, getRowsWithNull)
        } else {
            props.saveAlertToStore("enter correct time")
            props.showAlertInStore()
        }
    }
    const handlerKeyUp = event => {
        if (event.keyCode === 13) {
            handlerOnBlur(event)
        }
    }

    const handleDeleteRecord = e => {
        props.deleteRecordAction(props.user.id, getRowsWithNull)
    }
    let preparedDate = props.user.date.split("-").reverse().join("-");

    return <tr>
        <td>{props.user.user.firstName + " " + props.user.user.lastName}</td>
        <td>{props.user.date}</td>
        <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">example (12:00)</Tooltip>}>
            <td><input type="text"
                       placeholder={placeHolderStart}
                       onBlur={handlerOnBlur}
                       onChange={handlerOnChange}
                       onKeyUp={handlerKeyUp}
                       name="start"
                       value={state.start !== null ? state.start : "none"}/></td>
        </OverlayTrigger>
        <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">example (12:00)</Tooltip>}>
            <td><input type="text"
                       placeholder={placeHolderFinish}
                       onBlur={handlerOnBlur}
                       onChange={handlerOnChange}
                       onKeyUp={handlerKeyUp}
                       name="finish"
                       value={state.finish !== null ? state.finish : "none"}/></td>
        </OverlayTrigger>
        <td>{total}</td>
        <td>
            <button type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleShow}
            >delete
            </button>
        </td>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Are you sure want delete this record?</Modal.Title>
            </Modal.Header>
            <Modal.Body>You will not be able return it!</Modal.Body>
            <Modal.Footer>
                <Button variant="btn btn-secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="btn button-submit"
                        onClick={handleDeleteRecord}
                >
                    Confirm delete
                </Button>
            </Modal.Footer>
        </Modal>
        <Modal show={props.showInStore} onHide={() => props.closeAlertInStore()}>
            <Modal.Body>{props.alert}</Modal.Body>
        </Modal>
    </tr>
}

const mapStateToProps = state => {
    return {
        alert: state.app.alert,
        showInStore: state.app.show
    }
}

const mapDispatchToProps = {
    editRecordAction,
    deleteRecordAction,
    saveDateForRequestTable,
    saveAlertToStore,
    showAlertInStore,
    closeAlertInStore
}
export default connect(mapStateToProps, mapDispatchToProps)(RowTablesReports);