import React, {useEffect} from "react"
import {connect} from "react-redux";
import WorkDays from "./reportsPages/WorkDays";
import WorkHours from "./reportsPages/WorkHours";
import OvertimeHours from "./reportsPages/OvertimeHours";
import {getRowsWithNull} from "../../../redux/actions/appAction";
import FrameTablesReports from "./FrameTablesReports";

const ReportsSwitcher = (props) => {

    if (props.recordsWithNull.length){
        console.log(props.recordsWithNull)
        return (<div>
                <h1 className="text-center m-5">There are incorrect records. Fix them and then will see asked data.</h1>
                <FrameTablesReports/>
            </div>
        )
    }else{
        switch (props.pageTableSwitch) {

            case "workDays":
                return <WorkDays/>

            case "workHours":
                return <WorkHours/>

            case "overTime":
                return <OvertimeHours/>

            default:
                return <h1> default</h1>
        }
    }
}
const mapStateToProps = state => {
    return {
        pageTableSwitch: state.app.switcherReports,
        recordsWithNull:state.tableData.records,
        dateParams:state.app.dataForRequest
    }
}
const mapDispatchToProps={
    getRowsWithNull
}
export default connect(mapStateToProps, mapDispatchToProps)(ReportsSwitcher);