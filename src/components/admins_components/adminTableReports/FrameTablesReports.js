import React, {useEffect, useState} from "react";
import {connect} from "react-redux";
import TablesRowForReports from "./RowTablesReports";


const FrameTablesReports = (props) => {

    const [recordsToRender, setRecordsToRender] = useState(props.records)
    const [date, setDate] = useState({});

    const handlerInputDate = (event) => {
        setDate(prevState => ({...prevState, ...{[event.target.name]: event.target.value}}))
    }

    useEffect(() => {
        console.log(props.records)
        setRecordsToRender(props.records)
    }, [props.records])

    return (

        <div className="container mt-5">
            <div className="row">
                <div className="col">
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
                            {recordsToRender.map(item => <TablesRowForReports
                                user={item}
                                key={item.id}
                            />)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

const mapStateToProps = state => {
    return {
        records: state.tableData.records
    }
}
export default connect(mapStateToProps, null)(FrameTablesReports);