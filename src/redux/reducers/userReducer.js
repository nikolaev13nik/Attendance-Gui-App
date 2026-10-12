import {REMOVE_USER_FROM_STORE, SAVE_USER_TO_STORE} from "../actions/userAction";

const initialState = {
   user:null
};

export const userReducer = (state = initialState, action) => {

    switch (action.type) {

        case SAVE_USER_TO_STORE:
            return {...state, user: action.payload};

        case REMOVE_USER_FROM_STORE:
            return {...state,user:action.payload}

        default:
            return state;
    }
};