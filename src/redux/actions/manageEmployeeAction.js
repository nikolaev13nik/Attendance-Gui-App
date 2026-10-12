import {encoderBase64} from "../../utils/util";
import {
    getUriDeleteOrAddRole,
    URI_ADD_NEW_EMPLOYEE,
    URI_DELETE_EMPLOYEE,
    URI_EDIT_EMPLOYEE_DATA
} from "../../utils/configuration";
import {pageNavigationAction, pageNavigationSubAdminAction, saveAlertToStore, showAlertInStore} from "./appAction";


export function addNewEmployee(newEmployee) {
    return async dispatch => {
        try {
            const settings = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newEmployee)
            }
            let response = await fetch(URI_ADD_NEW_EMPLOYEE, settings)
            if (!response.ok) {
                if (response.status === 409) {
                    dispatch(saveAlertToStore("This employee already exists !"))
                    dispatch(showAlertInStore())
                    return
                }
                alert("error fetch registration line 28" + response.status, response.message)
                dispatch(pageNavigationSubAdminAction(""))
                return
            }

            let addedEmployee = await response.json();

            dispatch(saveAlertToStore(`Employee ${addedEmployee.firstName} ${addedEmployee.lastName} was added!`))
            dispatch(showAlertInStore())
            dispatch(pageNavigationSubAdminAction(""))

        } catch (e) {
            // ------------------------- TO DO-----------------------
            console.log("catch manageEmployeeAction", e.message)
            // ------------------------- TO DO-----------------------
        }
    }
}

export function editEmployeeAction(employee, credential) {

    employee.firstName = employee.firstName ? employee.firstName : null
    employee.lastName = employee.lastName ? employee.lastName : null
    employee.password = employee.password ? employee.password : null

    return async dispatch => {
        try {
            const settings = {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(credential)
                },
                body: JSON.stringify(employee)
            }
            let response = await fetch(URI_EDIT_EMPLOYEE_DATA + employee.idUser, settings)
            if (!response.ok) {
                console.log(response.status)
                if (response.status === 401) {
                    dispatch(pageNavigationAction(""));
                    alert("you need sign in again!");
                    return
                }

                alert("error in EditEmployeeAction-65 " + response.status + " " + response.statusText);
                dispatch(pageNavigationSubAdminAction(""))
                return
            }
            dispatch(saveAlertToStore("Employee was edited !"))
            dispatch(showAlertInStore())

            dispatch(pageNavigationSubAdminAction(""))
        } catch (e) {
            // ------------------------- TO DO-----------------------
            console.log("catch EditEmployeeAction", e.message)
            // ------------------------- TO DO-----------------------
        }
    }
}

export function deleteEmployeeAction(employeeToRemove, credential) {

    return async dispatch => {
        try {
            const settings = {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(credential)
                }
            };
            let response = await fetch(URI_DELETE_EMPLOYEE + employeeToRemove.idUser, settings)
            if (!response.ok) {
                alert("error in deleteEmployeeAction line 101 " + response.status + " " + response.statusText);
                dispatch(pageNavigationSubAdminAction(""))
                return
            }
            let emplResponsed = await response.json();

            dispatch(saveAlertToStore(`Employee ${emplResponsed.firstName} ${emplResponsed.lastName} was deleted!`))
            dispatch(showAlertInStore())

            dispatch(pageNavigationSubAdminAction(""))
        } catch (e) {
            // ------------------------- TO DO-----------------------
            console.log("catch EditEmployeeAction", e.message)
            // ------------------------- TO DO-----------------------
        }
    }
}

export function addRoleAction(employeeToAddRole, credential) {

    return async dispatch => {
        try {
            const settings = {
                method: "Post",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(credential)
                }
            }
            let response = await fetch(getUriDeleteOrAddRole(employeeToAddRole.idUser), settings)
            if (!response.ok) {
                alert("error in addRoleAction 132" + response.status + " " + response.statusText)
                dispatch(pageNavigationSubAdminAction(""))
                return
            }
            dispatch(saveAlertToStore(`Role administrator was added!`))
            dispatch(showAlertInStore())

            dispatch(pageNavigationSubAdminAction(""))
        } catch (e) {
            // ------------------------- TO DO-----------------------
            console.log("catch EditEmployeeAction ", e.message)
            // ------------------------- TO DO-----------------------
        }
    }
}

export function deleteRoleAction(employeeToRemoveRole, credential) {

    return async dispatch => {
        try {
            const settings = {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(credential)
                }
            }
            let response = await fetch(getUriDeleteOrAddRole(employeeToRemoveRole.idUser), settings)
            if (!response.ok) {
                alert("error in addRoleAction-135" + response.status + " " + response.statusText)
                dispatch(pageNavigationSubAdminAction(""))
                return
            }
            dispatch(saveAlertToStore("Role administrator was removed!"))
            dispatch(showAlertInStore())

            dispatch(pageNavigationSubAdminAction(""))

        } catch (e) {
            // ------------------------- TO DO-----------------------
            console.log("catch EditEmployeeAction ", e.message)
            // ------------------------- TO DO-----------------------
        }
    }
}