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

    function handleUpdateMix(e)
    {
        const plugin = props.selectedPlugin;
        plugin.mix = Number(e.target.value) / 9999;
        props.updatePlugin(plugin, "updateMix");
    }
    function handleSetIsBypassed(e)
    {
        const plugin = props.selectedPlugin;
        plugin.isBypassed = Boolean(e.target.checked);
        props.updatePlugin(plugin, "setBypass");
    }

    function drawGUIPreview()
    {
        if (props.selectedPlugin.type === "fx")
        {
            return (
                <div>
                    <input 
                        type="range"
                        min="0"
                        max="9999"
                        value={Math.round(9999 * props.selectedPlugin.mix)}
                        onChange={handleUpdateMix} />
                    <input
                        type="checkbox"
                        value={props.selectedPlugin.isBypassed}
                        onChange={handleSetIsBypassed} />
                    <GUIPreview
                        gui={props.selectedPlugin.gui}
                        parameters={props.selectedPlugin.parameters}
                        inEditMode={inEditMode}
                        handleModifyGUI={handleModifyGUI}
                        handleModifyParameter={handleModifyParameter} /> 
                </div>
                
            );
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