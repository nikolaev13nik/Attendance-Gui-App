import React, {useEffect} from "react";
import FrameTable from "./FrameTable";
import {removeAllRecords} from "../../../redux/actions/tableAction";
import {connect} from "react-redux";


const AllRecordsByDay = (props) => {

    useEffect(() => {
        return () => {
            props.removeAllRecords()
        }
    })
    return (
        <div>
            <FrameTable/>
        </div>
    )
}
const mapDispatchToProps = {
    removeAllRecords
}
export default connect(null, mapDispatchToProps)(AllRecordsByDay);


