import React from "react"
import {connect} from "react-redux";
import FormAddEmployee from "./forms/FormAddEmployee";
import FormEditEmployee from "./forms/FormEditEmployee";
import FormDeleteEmployee from "./forms/FormDeleteEmployee";
import FormAddRoleEmployee from "./forms/FormAddRoleEmployee";
import FormDeleteRoleEmployee from "./forms/FormDeleteRoleEmployee";
import AllRecordsByDay from "./adminTableReports/AllRecordsByDay";
import ReportsPerEmployee from "./adminTableReports/ReportsPerEmployee";


const AdminSwitcher = (props) => {
    switch (props.pageAdmin) {
        case "":
            return <div className="d-flex justify-content-center m-5 pt-5 flex-column text-center">
                <h1>Here you may get reports about users </h1>
                <h1>
                    or to manage employees accounts.
                </h1>
                <h2>
                    Use menu buttons.
                </h2>
            </div>
        case "FormAddRoleEmployee":
            return <FormAddRoleEmployee/>

        case "FormDeleteRoleEmployee":
            return <FormDeleteRoleEmployee/>

        case "FormAddEmployee":
            return <FormAddEmployee/>

        case "FormEditEmployee":
            return <FormEditEmployee/>

        case "FormDeleteEmployee":
            return <FormDeleteEmployee/>

        case "AllRecordsByDay":
            return <AllRecordsByDay/>

        case "ReportsPerEmployee":
            return <ReportsPerEmployee/>

        default:
            return <div>
                <h1>AdminSwitcher</h1>
            </div>
    }


}


const mapStateToProps = state => {
    return {
        pageAdmin: state.app.pageAdmin
    }
}
export default connect(mapStateToProps, null)(AdminSwitcher)