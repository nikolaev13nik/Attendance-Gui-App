import React from "react";
import Header from "../Header";
import AdminMenu from "./AdminMenu";
import AdminSwitcher from "./AdminSwitcher";
import AdminFooter from "./AdminFooter";


const AdminFrame = () => {
    return <div className="frame m-0 p-0" >
        <Header/>
        <AdminMenu/>
        <AdminSwitcher/>
        <AdminFooter/>
    </div>
}
export default AdminFrame;