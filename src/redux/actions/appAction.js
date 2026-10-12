import {
    URI_CHECK_ROWS_FOR_NULL,
    URI_GET_ALL_USERS,
    URI_GET_COUNT_WORK_DAY, URI_GET_HOURS_IN_RANGE, URI_GET_OVERTIME_IN_RANGE,
    URI_GET_RECORDS_IN_RANGE
} from "../../utils/configuration";
import {encoderBase64} from "../../utils/util";
import {saveAllRecords} from "./tableAction";

export const VIEW_PAGE = "APP/VIEW_PAGE";
export const VIEW_PAGE_SUB_ADMIN = "APP/VIEW_PAGE_SUB_ADMIN";
export const CHANGE_FLAG_LOGIN = "APP/CHANGE_FLAG_LOGIN";
export const SAVE_USERS_TO_STORE = "USER/SAVE_USERS_TO_STORE";
export const NAME_NUMBER_ADMIN = 123456789;
export const REMOVE_USERS_FROM_STORE = "USERS/REMOVE_USERS_TO_STORE"
export const VIEW_PAGE_TABLES_SWITCH = "APP/VIEW_PAGE_TABLES_SWITCH"
export const SAVE_DATE_FOR_REQUEST_TABLE = "APP/SAVE_DATE_FOR_REQUEST_TABLE"
export const REMOVE_DATE_FOR_REQUEST_TABLE = "APP/REMOVE_DATE_FOR_REQUEST_TABLE"
export const SAVE_NUM_WORK_DAY = "APP/SAVE_NUM_WORK_DAY"
export const SAVE_WORK_HOURS = "APP/SAVE_WORK_HOURS"
export const SAVE_OVERTIME_HOURS = "APP/SAVE_OVERTIME_HOURS"
export const SAVE_RECORDS_TO_ARRAY = "APP/SAVE_RECORDS_TO_ARRAY"
export const SWITCHER_PAGE_REPORTS = "APP/SWITCHER_PAGE_REPORTS"
export const SAVE_ALERT_TO_STORE = "APP/SAVE_ALERT_TO_STORE";
export const SHOW_ALERT_IN_STORE="APP/SHOW_ALERT_IN_STORE";
export const CLOSE_ALERT_IN_STORE="APP/CLOSE_SHOW_ALERT_IN_STORE";

export function saveAlertToStore(payload) {
    return {
        type: SAVE_ALERT_TO_STORE,
        payload: payload
    }
}

export function showAlertInStore() {
    return {
        type:SHOW_ALERT_IN_STORE,
    }
}
export function closeAlertInStore() {
    return {
        type: CLOSE_ALERT_IN_STORE,
    }
}

export function pageNavigationAction(page) {

    return {
        type: VIEW_PAGE,
        payload: page
    }
}

export function pageNavigationSubAdminAction(page) {

    return {
        type: VIEW_PAGE_SUB_ADMIN,
        payload: page
    }
}

export function pageTableSwitch(page) {
    return {
        type: VIEW_PAGE_TABLES_SWITCH,
        payload: page
    }
}

export function saveUsersToStore(array) {
    return {
        type: SAVE_USERS_TO_STORE,
        payload: array

    }
}

export function removeUsersFromStore() {
    return {
        type: REMOVE_USERS_FROM_STORE,
    }
}

export function flagLogin(flag) {
    return {
        type: CHANGE_FLAG_LOGIN,
        payload: flag
    }
}

export function saveDateForRequestTable(data) {

    return {
        type: SAVE_DATE_FOR_REQUEST_TABLE,
        payload: data
    }
}

export function removeDateForRequestTable() {

    return {
        type: REMOVE_DATE_FOR_REQUEST_TABLE,
    }
}

export function saveNumWorkday(count) {
    return {
        type: SAVE_NUM_WORK_DAY,
        payload: count
    }
}

export function saveWorkHours(count) {
    return {
        type: SAVE_WORK_HOURS,
        payload: count
    }
}

export function saveOvertimeHours(count) {
    return {
        type: SAVE_OVERTIME_HOURS,
        payload: count
    }
}

export function saveRecordsToArray(array) {
    return {
        type: SAVE_RECORDS_TO_ARRAY,
        payload: array
    }

}

export function switchPageReports(page) {
    return {
        type: SWITCHER_PAGE_REPORTS,
        payload: page
    }
}


export function getRowsWithNull(params) {
    return async (dispatch, getState) => {
        try {
            const authUser = getState().user.user;
            const settings = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(authUser)
                }
            }
            let paramsUri = `idUser=${params.idUser}&startDate=${params.startDate}&finishDate=${params.finishDate}`;
            let response = await fetch(URI_CHECK_ROWS_FOR_NULL + paramsUri, settings);
            const json = await response.json();
            dispatch(saveAllRecords(json))
        } catch (e) {
            //---------------------------TO DO-----------------------
            alert("error in getRowsWithNull line 159")
            // ------------------------- TO DO-----------------------
        }
    }
}

export function getRecordsInRange() {

    return async (dispatch, getState) => {
        try {
            const authUser = getState().user.user;
            const settings = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(authUser)
                }
            }
            let params=getState().app.dataForRequest
            let paramsUri = `idUser=${params.idUser}&startDate=${params.startDate}&finishDate=${params.finishDate}`;
            let response = await fetch(URI_GET_RECORDS_IN_RANGE + paramsUri, settings);
            const json = await response.json();
            dispatch(saveRecordsToArray(json))
// TO DO
        } catch (e) {
            //---------------------------TO DO-----------------------
            alert("error in getRecordsInRange 185 ")
            // ------------------------- TO DO-----------------------
        }
    }
}

export function getNumWorkDay(params) {

    return async (dispatch, getState) => {
        try {
            const authUser = getState().user.user;
            const settings = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(authUser)
                }
            }
            let paramsUri = `idUser=${params.idUser}&startDate=${params.startDate}&finishDate=${params.finishDate}`;
            let response = await fetch(URI_GET_COUNT_WORK_DAY + paramsUri, settings);
            const json = await response.json();
            dispatch(saveNumWorkday(json))
        } catch (e) {
            //---------------------------TO DO-----------------------
            alert("error in getNumWorkDay 209")
            // ------------------------- TO DO-----------------------
        }
    }
}

export function getHoursInRange(params) {

    return async (dispatch, getState) => {
        try {
            const authUser = getState().user.user;
            const settings = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(authUser)
                }
            }

            let paramsUri = `idUser=${params.idUser}&startDate=${params.startDate}&finishDate=${params.finishDate}`;
            let response = await fetch(URI_GET_HOURS_IN_RANGE + paramsUri, settings);

            const json = await response.json();
            dispatch(saveWorkHours(json))

        } catch (e) {
            //---------------------------TO DO-----------------------

            alert("error in getHoursInRange  237" + e.message + e)
            // ------------------------- TO DO-----------------------
        }
    }
}

export function getOverTimeInRange(params) {
    return async (dispatch, getState) => {
        try {
            const authUser = getState().user.user;
            const settings = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(authUser)
                }
            }

            let paramsUri = `idUser=${params.idUser}&startDate=${params.startDate}&finishDate=${params.finishDate}`;
            let response = await fetch(URI_GET_OVERTIME_IN_RANGE + paramsUri, settings);
            const json = await response.json();
            dispatch(saveOvertimeHours(json))
        } catch (e) {
            //---------------------------TO DO-----------------------

            alert("error in getOverTimeInRange ")
            // ------------------------- TO DO-----------------------
        }
    }
}


export function getEmployeesAction(flag) {
    return async dispatch => {
        try {
            const settings = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            };
            const response = await fetch(URI_GET_ALL_USERS, settings);
            const json = await response.json();
            dispatch(pageNavigationAction("Cards"))

            if (flag) {
                dispatch(saveUsersToStore(json.filter(u => u.roles.includes("Administrator"))))
                dispatch(flagLogin(true))
                return
            }

            dispatch(saveUsersToStore(json.filter(u => u.idUser !== (NAME_NUMBER_ADMIN))))
            dispatch(flagLogin(false))

        } catch (e) {
            //---------------------------TO DO-----------------------
            alert("error in getEmployeesAction 293")
            // ------------------------- TO DO-----------------------
        }


    }
}

export function getEmployeesWithoutAdminAction() {
    return async dispatch => {
        try {
            const settings = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            };
            const response = await fetch(URI_GET_ALL_USERS, settings);
            const json = await response.json();
            dispatch(saveUsersToStore(json.filter(u => u.idUser !== (NAME_NUMBER_ADMIN))))

        } catch (e) {
            //---------------------------TO DO-----------------------

            alert("error in getEmployeesWithoutAdminAction line 317")
            // ------------------------- TO DO-----------------------
        }
    }
}

