import {combineReducers} from "redux";
import {appReducer} from "./appReducer";
import {userReducer} from "./userReducer";
import {tableReducer} from "./tableReducer";




export const rootReducer = combineReducers({
    app: appReducer,
    user:userReducer,
    tableData:tableReducer
})