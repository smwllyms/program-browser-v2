import "./GUIEditor.css"

import GUIPreview from "./GUIPreview/GUIPreview.js";

import React from "react";

export default function GUIEditor(props)
{

    const [inEditMode, setInEditMode] = React.useState(false); // Start in preview

    const nameRef = React.useRef(null);

    function handleChangeTitle()
    {
        props.selectedPlugin.name = nameRef.current.value;
        props.updatePlugin(props.selectedPlugin, true);
    }

    function handleEdit()
    {
        setInEditMode(!inEditMode);
    }

    function handleModifyGUI(guiData, addedParameter)
    {
        props.selectedPlugin.gui = guiData;
        props.updatePlugin(props.selectedPlugin, addedParameter ? "updateParameters" :  "updateGUI" );
    }

    function handleModifyParameter(tagName, newValue)
    {
        const plugin = props.selectedPlugin;
        const params = plugin.parameters;

        const param = params.find(p=>p.tag===tagName);
        param.value = newValue;

        plugin.parameters = params;
        props.updatePlugin(plugin, "updateParameters");
    }

    function drawGUIPreview()
    {
        if (props.selectedPlugin.type === "fx")
        {
            return <GUIPreview
                gui={props.selectedPlugin.gui}
                parameters={props.selectedPlugin.parameters}
                handleModifyGUI={handleModifyGUI}
                handleModifyParameter={handleModifyParameter} /> 
        }
        else
        {
            return <div></div>
        }
        
    }

    if (!props.selectedPlugin)
    {
        return <h2>No Plugin Selected</h2>
    }
    else return (
        <div className="gui-editor">
            <span style={{fontSize: "8px"}}>ID: {props.selectedPlugin.id}</span>
            <div>
            <span>Name: </span><input 
                type="text"
                ref={nameRef}
                value={props.selectedPlugin.name}
                onChange={handleChangeTitle} />
                <button onClick={handleEdit}>{inEditMode ? "Preview" : "Edit"}</button>
                </div>
            {
                drawGUIPreview()
            }
                       
        </div>
    )
}