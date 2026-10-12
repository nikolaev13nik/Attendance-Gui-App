import {encoderBase64} from "../../utils/util";
import {URI_DELETE_RECORD_BY_ID_ROW, URI_EDIT_RECORD, URI_GET_ALL_RECORDS_BY_DAY} from "../../utils/configuration";
import {saveDateForRequestTable} from "./appAction";

export const SAVE_ALL_RECORDS_TO_STORE = "SAVE_ALL_RECORDS_TO_STORE";
export const REMOVE_ALL_RECORDS_FROM_STORE = "REMOVE_ALL_RECORDS_FROM_STORE";


export function saveAllRecords(array) {
    return {
        type: SAVE_ALL_RECORDS_TO_STORE,
        payload: array
    }
}
export function removeAllRecords() {
    return {
        type: REMOVE_ALL_RECORDS_FROM_STORE
    }
}

export function deleteRecordAction(id,callBack) {
    return  async (dispatch,getState)=>{
        try {
            const authUser = getState().user.user;
            const settings = {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(authUser)
                }
            }
            let response = await fetch(URI_DELETE_RECORD_BY_ID_ROW + id, settings)
            if (!response.ok) {
                alert("not ok-200 =deleteRecordAction  " + response.status + " " + response.statusText)
            }
            // let result = await response.json();
            dispatch(callBack(getState().app.dataForRequest))

        } catch (e) {
            // ------------------------- TO DO-----------------------
            console.log("catch getAllRecordsByDay", e.message)
            // ------------------------- TO DO-----------------------
        }
    }
}

export function fetchAllRecordsByDay(date) {
    return async (dispatch,getState) => {
        try {
            const authUser = getState().user.user;
            const settings = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(authUser)
                }
            }
            let response = await fetch(URI_GET_ALL_RECORDS_BY_DAY + date.date, settings)
            if (!response.ok) {
                alert("not ok-200 =getAllRecordsByDay  " + response.status + " " + response.statusText)
            }
            let result = await response.json();
            dispatch(saveDateForRequestTable(date))
            dispatch(saveAllRecords(result));
        } catch (e) {
            // ------------------------- TO DO-----------------------
            console.log("catch getAllRecordsByDay", e.message)
            // ------------------------- TO DO-----------------------
        }
    }
}

export function editRecordAction(record,callBackDispatch) {
    return async (dispatch,getState) => {
        try {
            const authUser = getState().user.user;
            const settings = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(authUser)
                },
                body:JSON.stringify({
                    id:record.id,
                    start:record.start?record.start:null,
                    finish:record.finish?record.finish:null
                })
            }
            console.log("===")
            console.log(record)
            let response = await fetch(URI_EDIT_RECORD, settings)
            if (!response.ok) {
                alert("not ok-200 =editRecordAction  " + response.status + " " + response.statusText)
            }
            // let result = await response.json();
            dispatch(callBackDispatch(getState().app.dataForRequest))

        } catch (e) {
            // ------------------------- TO DO-----------------------
            console.log("catch editRecordAction", e.message)
            // ------------------------- TO DO-----------------------
        }
    }
}
