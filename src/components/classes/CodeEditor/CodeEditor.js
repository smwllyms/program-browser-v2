import "./CodeEditor.css"

import React from "react"

export default function CodeEditor(props)
{
    const textArea = React.useRef(null);
    const generatorTypeRef = React.useRef(null);

    function compile()
    {
        props.updateCode(textArea.current.value);
    }

    function loadSample()
    {
        // textArea.current.value = props.sampleFXProgram();
        props.sampleFXProgram();
    }

    function modifyPlugin()
    {
        const plugin = {...props.selectedPlugin};

        plugin.config.type = generatorTypeRef.current.value;

        props.updatePlugin(plugin, "updateCode")
    }

    if (props.selectedPlugin && props.selectedPlugin.type === "fx")
    {
        return (
            <div className="code-editor" key={props.selectedPlugin.id}>
                <textarea 
                    ref={textArea}
                    key={Math.random()}
                    defaultValue={props.selectedPlugin.userCode}>

                </textarea>
                <div>
                    <a href="#load-sample" onClick={loadSample}>Load Sample</a>
                    <a href="#compile" onClick={compile}>Save & Compile</a>
                </div>
            </div>
        )
    }
    else if (props.selectedPlugin && props.selectedPlugin.type === "generator")
    {
        return (
            <div className="code-editor" key={props.selectedPlugin.id}>
                <h2>Generator Options</h2>
                <div>
                    <span>Type</span>
                    <select type="select"
                        defaultValue={props.selectedPlugin.config.type}
                        onChange={modifyPlugin}
                        ref={generatorTypeRef}>
                        {["sawtooth", "sine", "square"].map(v=>{
                            return <option key={v} value={v}>{v}</option>
                        })}
                    </select>
                </div>
            </div>
        )
    }
    else
    {
        return <h2 style={{width: "50%"}}>No Plugin Selected</h2>;
    }
    
}