import "./Header.css"

import React from "react"

export default function Header(props) {
    const [showFileSubmenu, setShowFileSubmenu] =  React.useState(false);
    const [showEditSubmenu, setShowEditSubmenu] =  React.useState(false);
    const [showPluginSubmenu, setShowPluginSubmenu] =  React.useState(false);
    const [showGUISubmenu, setShowGUISubmenu] = React.useState(false);

    const selected = props.selectedPlugin;
    const name = selected ? selected.name : "None";

    return (
        <header className="header">
            <div style={{float:"left"}}>
                <ul className="header-menu">
                    <li>Program Browser</li>
                </ul>
                <ul className="header-menu">
                    <li>DragNDrop</li>
                    <li><a href="#newfx" onClick={props.addNewFXPlugin}>Add FX</a></li>
                    <li><a href="#new-generator" onClick={props.addNewGeneratorPlugin}>Add Generator</a></li>
                </ul>
                <ul className="header-menu">
                    <li>GUI</li>
                    <li className="submenu-parent">
                        <ul className="subheader-menu">
                            <li>Add...</li>
                            <li><a href="#addGUIComponent" onClick={()=>props.addGUIParameter("slider")}>Slider</a></li>
                            <li><a href="#addGUIComponent" onClick={()=>props.addGUIParameter("label")}>Label</a></li>
                        </ul>
                    </li>
                    <li><a href="#new-generator" onClick={props.deleteGUIParameter}>Delete</a></li>
                </ul>
            </div>
            <div style={{float:"right"}}>
                <span className="selected">Currently selected: {name}</span>
            </div>
        </header>
    );
}