import {URI_LOGIN, URI_RECORD_START_FINISH} from "../../utils/configuration";
import {closeAlertInStore, pageNavigationAction, saveAlertToStore, showAlertInStore} from "./appAction";
import {encoderBase64} from "../../utils/util";

export const REMOVE_USER_FROM_STORE = "USER/REMOVE_USER_FROM_STORE"
export const SAVE_USER_TO_STORE = "USER/SAVE_USER_TO_STORE";


export function loginAction(userForFetch, flagLogin) {
    return async dispatch => {
        try {
            const settings = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(userForFetch)
                }
            }
            const response = await fetch(URI_LOGIN, settings)
            if (!response.ok) {
                dispatch(saveAlertToStore("Your password is not correct,try again"))
                dispatch(showAlertInStore())
                setTimeout(() => {
                    dispatch(closeAlertInStore())
                }, 5000)
                return
            }
            dispatch(saveUserToStore(userForFetch))
            if (flagLogin) {
                dispatch(pageNavigationAction("AdminFrame"))
                return
            }
            dispatch(pageNavigationAction("Choice"))

        } catch (e) {
            // ------------------------- TO DO-----------------------
            console.log("catch userAction", e.message)
            // ------------------------- TO DO-----------------------
        }
    }
}


export function writeRecordStartOrFinish(flag, userForFetch) {
    let endUri = flag ? "start/" + userForFetch.idUser : "finish/" + userForFetch.idUser;
    return async dispatch => {
        try {
            const settings = {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": encoderBase64(userForFetch)
                }
            }
            const response = await fetch(URI_RECORD_START_FINISH + endUri, settings)
            if (!response.ok) {
                console.log("error" + response.status, response.message)
                alert("Unauthorized")
                dispatch(pageNavigationAction("Cards"))
                return
            }

            const record = await response.json();
            let timeStamp = flag ? record.start : record.finish
            let array = timeStamp.split("T");
            console.log("action write")
            dispatch(saveAlertToStore("Your time was written as :" + array[1]))
            dispatch(showAlertInStore())
            setTimeout(() => {
                dispatch(removeUserToStore())
                dispatch(pageNavigationAction("Menu"))
                dispatch(closeAlertInStore())
            }, 3000)


        } catch (e) {
            // ------------------------- TO DO-----------------------
            console.log("catch userAction record failed", e.message)
            // ------------------------- TO DO-----------------------
        }

    }
}

export function removeUserToStore() {
    return {
        type: REMOVE_USER_FROM_STORE,
        payload: null

    }
}

export function saveUserToStore(user) {
    return {
        type: SAVE_USER_TO_STORE,
        payload: user

    }
}