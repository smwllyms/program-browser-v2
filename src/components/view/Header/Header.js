import "./Header.css"

import React from "react"

export default function Header(props) {

    const selected = props.selectedPlugin; 
    const name = selected ? selected.name : "None";

    return (
        <header className="header">
            <div style={{float:"left"}}>
                <ul className="header-menu">
                    <li>Program Browser</li>
                </ul>
                <ul className="header-menu">
                    <li>New Node</li>
                    <li><a href="#newfx" onClick={props.addNewFXPlugin}>Effect</a></li>
                    <li><a href="#new-generator" onClick={props.addNewGeneratorPlugin}>Generator</a></li>
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
                <ul className="header-menu">
                    <li>Help</li>
                    <li><a href="#demo" onClick={props.sampleFXProgram}>Load Demo</a></li>
                </ul>
            </div>
            <div style={{float:"right"}}>
                <span className="selected">Currently selected: {name}</span>
            </div>
        </header>
    );
}