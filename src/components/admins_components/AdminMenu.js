import React from "react";
import {Dropdown, Modal} from "react-bootstrap";
import {connect} from "react-redux";
import {closeAlertInStore, pageNavigationSubAdminAction} from "../../redux/actions/appAction";

const AdminMenu = (props) => {

    return (
        <div className="container mt-5">
            <div className="row justify-content-around">
                <div className="dropdown_button">
                    <Dropdown>
                        <Dropdown.Toggle variant="btn btn-lg btn-outline-secondary " id="dropdown-basic">
                            Manage employee
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => props.pageNavigationSubAdminAction("FormAddEmployee")}>Add new
                                employee</Dropdown.Item>
                            <Dropdown.Item onClick={() => props.pageNavigationSubAdminAction("FormDeleteEmployee")}>Delete
                                employee</Dropdown.Item>
                            <Dropdown.Item onClick={() => props.pageNavigationSubAdminAction("FormAddRoleEmployee")}>Add
                                role to employee</Dropdown.Item>
                            <Dropdown.Item onClick={() => props.pageNavigationSubAdminAction("FormDeleteRoleEmployee")}>Remove
                                role to employee</Dropdown.Item>
                            <Dropdown.Item onClick={() => props.pageNavigationSubAdminAction("FormEditEmployee")}>Edit
                                employee</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
                <div className=" dropdown_button">
                    <Dropdown>
                        <Dropdown.Toggle variant="btn btn-lg  btn-outline-secondary" id="dropdown-basic">
                            Manage reports
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => props.pageNavigationSubAdminAction("AllRecordsByDay")}>All
                                records by day</Dropdown.Item>
                            <Dropdown.Item onClick={() => props.pageNavigationSubAdminAction("ReportsPerEmployee")}>Reports
                                per employee</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
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
    pageNavigationSubAdminAction,
    closeAlertInStore
}
export default connect(mapStateToProps, mapDispatchToProps)(AdminMenu);