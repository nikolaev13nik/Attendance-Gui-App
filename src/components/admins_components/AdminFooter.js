import React from "react";
import {connect} from "react-redux";
import {pageNavigationAction, pageNavigationSubAdminAction} from "../../redux/actions/appAction";
import {removeAllRecords} from "../../redux/actions/tableAction";

const AdminFooter = (props) => {
    return (
        <div className="d-flex m-5 pb-5 justify-content-around footer">
            <button type="button"
                    onClick={() => {
                        props.pageNavigationAction("")
                    }}
                    className="btn btn-outline-danger">Main menu
            </button>
            <button type="button"
                    onClick={() => {
                        props.pageNavigationSubAdminAction("")
                    }}
                    className="btn btn-outline-danger">Admin Menu
            </button>
        </div>
    )
};
const mapDispatchToProps = {
    pageNavigationSubAdminAction,
    pageNavigationAction,
    removeAllRecords
}
export default connect(null, mapDispatchToProps)(AdminFooter);