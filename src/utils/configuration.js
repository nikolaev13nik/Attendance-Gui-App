export const URI_GET_ALL_USERS="http://localhost:8080/account/users"
export const URI_LOGIN="http://localhost:8080/account/login"
export const URI_RECORD_START_FINISH="http://localhost:8080/record/"
export const URI_ADD_NEW_EMPLOYEE="http://localhost:8080/account/user"
export const URI_EDIT_EMPLOYEE_DATA="http://localhost:8080/account/user/password/"
export const URI_DELETE_EMPLOYEE="http://localhost:8080/account/user/"
export const URI_GET_ALL_RECORDS_BY_DAY="http://localhost:8080/record/records/?localDate="
export const URI_EDIT_RECORD="http://localhost:8080/record"
export const URI_DELETE_RECORD_BY_ID_ROW="http://localhost:8080/record/remove/"
export const URI_CHECK_ROWS_FOR_NULL="http://localhost:8080/record/check?"
export const URI_GET_RECORDS_IN_RANGE="http://localhost:8080/record/range/records/?"

export const URI_GET_COUNT_WORK_DAY="http://localhost:8080/record/workdays?"
export const URI_GET_HOURS_IN_RANGE="http://localhost:8080/record/hours?"
export const URI_GET_OVERTIME_IN_RANGE="http://localhost:8080/record/overtime?"




export function getUriDeleteOrAddRole(idUser){
return `http://localhost:8080/account/user/${idUser}/role/Administrator`;
}