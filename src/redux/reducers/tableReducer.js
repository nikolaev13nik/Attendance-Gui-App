
import {REMOVE_ALL_RECORDS_FROM_STORE, SAVE_ALL_RECORDS_TO_STORE} from "../actions/tableAction";

const initialState = {
    records: []
};


export const tableReducer = (state = initialState, action) => {

    switch (action.type) {

        case SAVE_ALL_RECORDS_TO_STORE:
            return {...state, records: action.payload}

        case REMOVE_ALL_RECORDS_FROM_STORE:
            return {...state, records:[]}


        default:
            return state;
    }
};