import React, {useEffect, useState} from "react";
import {connect} from "react-redux";
import {getRecordsInRange, saveRecordsToArray, switchPageReports} from "../../../../redux/actions/appAction";
import TableRecordRow from "./RowRecordTable";

const FrameRecordTable = (props) => {

    useEffect(() => {
        return () => {
            props.saveRecordsToArray([])

        }
    }, [])

    return (

        <div className="container mt-5">
            <div className="row">
                <div className="col">
                    <h1 className="text-center mb-5">All records in that period:</h1>

                    <div className="col">
                        <table className="table">
                            <thead>
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Date</th>
                                <th scope="col">Start</th>
                                <th scope="col">End</th>
                                <th scope="col">hours</th>
                            </tr>
                            </thead>
                            <tbody>
                            {props.arrayRecords.map(item => <TableRecordRow user={item} key={item.id}/>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
const mapDispatchToProps = {
    getRecordsInRange,
    saveRecordsToArray,
    switchPageReports
}
const mapStateToProps = state => {
    return {
        arrayRecords: state.app.arrayRecords
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(FrameRecordTable);


