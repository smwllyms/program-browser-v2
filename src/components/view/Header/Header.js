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
                <nav>
                    <ul>
                        <li onMouseEnter={() => setShowFileSubmenu(true)} onMouseLeave={() => setShowFileSubmenu(false)}>
                            File
                            {showFileSubmenu && (
                                <ul>
                                    <li>Dummy Submenu 1</li>
                                    <li>Dummy Submenu 2</li>
                                </ul>
                            )}
                        </li>
                        <li onMouseEnter={() => setShowEditSubmenu(true)} onMouseLeave={() => setShowEditSubmenu(false)}>
                            Edit
                            {showEditSubmenu && (
                                <ul>
                                    <li>Dummy Submenu 1</li>
                                    <li>Dummy Submenu 2</li>
                                </ul>
                            )}
                        </li>
                        <li onMouseEnter={() => setShowPluginSubmenu(true)} onMouseLeave={() => setShowPluginSubmenu(false)}>
                            Plugin
                            {showPluginSubmenu && (
                                <ul>
                                    <li><a href="#newfx" onClick={props.addNewFXPlugin}>Add FX</a></li>
                                    <li><a href="#new-generator" onClick={props.addNewGeneratorPlugin}>Add Generator</a></li>
                                </ul>
                            )}
                        </li>
                        <li onMouseEnter={() => setShowGUISubmenu(true)} onMouseLeave={() => setShowGUISubmenu(false)}>
                            GUI
                            {showGUISubmenu && (
                                <ul>
                                    <li>Dummy Submenu 1</li>
                                    <li>Dummy Submenu 2</li>
                                </ul>
                            )}
                        </li>
                    </ul>
                </nav>
            </div>
            <div style={{float:"right"}}>
                <span>Currently selected: {name}</span>
            </div>
        </header>
    );
}